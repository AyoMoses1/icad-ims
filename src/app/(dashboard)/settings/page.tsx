"use client";

import { useState } from "react";
import { Save, User, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import { getInitials } from "@/lib/utils";
import { apiGetAuth } from "@/lib/api-client";
import { UserInfo } from "@/types";
import { useEffect } from "react";

export default function SettingsPage() {
  const { user, updateUser, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    dateOfBirth: user?.dateOfBirth || "",
    country: user?.country || "",
  });

  // Fetch user info from API on mount (only once)
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserInfo = async () => {
      try {
        console.log('Settings Page - Fetching user info...');
        setIsLoadingUserInfo(true);
        
        // Check if we have a token before making the request
        const { token } = useAuthStore.getState();
        console.log('Settings Page - Token available:', !!token);
        
        if (!token) {
          console.warn('Settings Page - No token available, skipping userinfo fetch');
          setIsLoadingUserInfo(false);
          return;
        }
        
        const userInfo = await apiGetAuth<UserInfo>("/connect/userinfo");
        console.log('Settings Page - User info received:', userInfo);
        
        // Only update if component is still mounted
        if (!isMounted) return;
        
        // Map API response fields to our form fields
        // API uses given_name/family_name, but we also support firstName/lastName
        const firstName = userInfo.given_name || userInfo.firstName || "";
        const lastName = userInfo.family_name || userInfo.lastName || "";
        const fullName = userInfo.name || userInfo.fullName || `${firstName} ${lastName}`.trim() || "";
        
        // Update profile state with fetched data
        setProfile({
          firstName: firstName,
          middleName: userInfo.middleName || "",
          lastName: lastName,
          email: userInfo.email || "",
          phoneNumber: userInfo.phoneNumber || "",
          dateOfBirth: userInfo.dateOfBirth || "",
          country: userInfo.country || "",
        });

        // Update user in store if needed
        if (userInfo) {
          const currentUser = useAuthStore.getState().user;
          const updatedUser = {
            ...currentUser,
            id: userInfo.sub || userInfo.id || currentUser?.id || "",
            firstName: firstName || currentUser?.firstName || "",
            lastName: lastName || currentUser?.lastName || "",
            email: userInfo.email || currentUser?.email || "",
            phoneNumber: userInfo.phoneNumber || currentUser?.phoneNumber || "",
            middleName: userInfo.middleName || currentUser?.middleName,
            dateOfBirth: userInfo.dateOfBirth || currentUser?.dateOfBirth,
            country: userInfo.country || currentUser?.country || "",
            emailVerified: userInfo.emailVerified || userInfo.email_verified || false,
            phoneVerified: userInfo.phoneVerified || userInfo.phone_verified || false,
            twoFactorEnabled: userInfo.twoFactorEnabled || false,
          };
          
          // Update fullName in the user object
          if (currentUser) {
            updatedUser.fullName = fullName || currentUser.fullName || "";
          }
          
          updateUser(updatedUser);
          console.log('Settings Page - User updated in store:', updatedUser);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Settings Page - Failed to fetch user info:", error);
        toast.error("Failed to load profile", {
          description: error instanceof Error ? error.message : "Please try refreshing the page",
        });
      } finally {
        if (isMounted) {
          setIsLoadingUserInfo(false);
        }
      }
    };

    fetchUserInfo();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    securityAlerts: true,
    weeklyDigest: false,
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateUser(profile);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notification preferences saved");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingUserInfo && (
                <div className="text-center py-4 text-muted-foreground">
                  Loading profile information...
                </div>
              )}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="text-xl">
                    {user ? getInitials(user.fullName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile({ ...profile, firstName: e.target.value })
                    }
                    disabled={isLoadingUserInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={profile.middleName}
                    onChange={(e) =>
                      setProfile({ ...profile, middleName: e.target.value })
                    }
                    disabled={isLoadingUserInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile({ ...profile, lastName: e.target.value })
                    }
                    disabled={isLoadingUserInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    disabled={isLoadingUserInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phoneNumber}
                    onChange={(e) =>
                      setProfile({ ...profile, phoneNumber: e.target.value })
                    }
                    disabled={isLoadingUserInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ""}
                    onChange={(e) =>
                      setProfile({ ...profile, dateOfBirth: e.target.value })
                    }
                    disabled={isLoadingUserInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) =>
                      setProfile({ ...profile, country: e.target.value })
                    }
                    disabled={isLoadingUserInfo}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} loading={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        pushNotifications: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about security-related events
                    </p>
                  </div>
                  <Switch
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        securityAlerts: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of activity
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        weeklyDigest: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} loading={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and two-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Change Password</h4>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      {user?.twoFactorEnabled ? "Disable" : "Enable"} 2FA
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Two-factor authentication is not yet implemented.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Theme customization coming soon. The app currently follows your
                system preferences for light/dark mode.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}







