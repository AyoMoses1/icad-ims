"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore, useWorkspaceStore } from "@/store";
import { apiPostForm, apiGetAuth } from "@/lib/api-client";
import { TokenResponse, UserInfo, User, UserStatus } from "@/types";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const { initializeFromToken } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);

    try {
      // Get OAuth credentials from environment variables
      const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
      const clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET;
      const grantType = process.env.NEXT_PUBLIC_GRANT_TYPE || "password";

      if (!clientId || !clientSecret) {
        throw new Error("OAuth credentials are not configured");
      }

      // Call the token endpoint with form-urlencoded data
      const tokenResponse = await apiPostForm<TokenResponse>("/connect/token", {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: grantType,
        username: data.email,
        password: data.password,
        scope: "openid profile email",
      });

      console.log("Token Response:", tokenResponse);
      console.log("Token Response access_token:", tokenResponse.access_token);
      console.log(
        "Token Response access_token type:",
        typeof tokenResponse.access_token
      );
      console.log(
        "Token Response access_token length:",
        tokenResponse.access_token?.length
      );

      // Calculate expiration time (default to 1 hour if expires_in not provided)
      const expiresIn = tokenResponse.expires_in || 3600;
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Temporarily set token in store to fetch user info
      const tempSession = {
        user: {
          id: "",
          username: data.email.split("@")[0],
          email: data.email,
          phoneNumber: "",
          firstName: "",
          lastName: "",
          fullName: data.email,
          country: "",
          status: "ACTIVE" as UserStatus,
          emailVerified: false,
          phoneVerified: false,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: tokenResponse.access_token, // Fixed: use access_token not accessToken
        refreshToken: tokenResponse.refresh_token || "", // Fixed: use refresh_token not refreshToken
        expiresAt,
      };
      setSession(tempSession);

      // Fetch user info from /connect/userinfo
      let userInfo: UserInfo;
      try {
        userInfo = await apiGetAuth<UserInfo>("/connect/userinfo");
      } catch (error) {
        // If userinfo fails, continue with minimal user data
        console.warn("Failed to fetch user info:", error);
        toast.success("Welcome back!", {
          description: "You have successfully signed in.",
        });
        router.push("/");
        return;
      }

      // Convert UserInfo to User format
      const user: User = {
        id: userInfo.id || userInfo.sub || "",
        username: userInfo.username || data.email.split("@")[0],
        email: userInfo.email || data.email,
        phoneNumber: userInfo.phoneNumber || "",
        firstName: userInfo.firstName || "",
        middleName: userInfo.middleName,
        lastName: userInfo.lastName || "",
        dateOfBirth: userInfo.dateOfBirth,
        country: userInfo.country || "",
        status: (userInfo.status as UserStatus) || UserStatus.ACTIVE,
        emailVerified:
          userInfo.emailVerified || userInfo.email_verified || false,
        phoneVerified:
          userInfo.phoneVerified || userInfo.phone_verified || false,
        twoFactorEnabled: userInfo.twoFactorEnabled || false,
        createdAt: userInfo.createdAt || new Date().toISOString(),
        updatedAt: userInfo.updatedAt || new Date().toISOString(),
      };

      // Create full session with user data
      const accessToken = tokenResponse.access_token;
      const refreshToken = tokenResponse.refresh_token || "";

      console.log("Before creating session:", {
        accessTokenExists: !!accessToken,
        accessTokenType: typeof accessToken,
        accessTokenLength: accessToken?.length,
        refreshTokenExists: !!refreshToken,
      });

      const session = {
        user: {
          ...user,
          fullName:
            userInfo.fullName ||
            `${user.firstName} ${user.lastName}`.trim() ||
            user.email,
        },
        token: accessToken,
        refreshToken: refreshToken,
        expiresAt,
      };

      console.log("Sign In - Session to Set:", {
        hasToken: !!session.token,
        tokenValue: session.token
          ? session.token.substring(0, 50) + "..."
          : "MISSING",
        tokenLength: session.token?.length,
        tokenType: typeof session.token,
        user: session.user.email,
        refreshToken: session.refreshToken?.substring(0, 50) + "...",
        expiresAt: session.expiresAt,
      });

      setSession(session);

      // Wait a bit and check again
      setTimeout(() => {
        const storeState = useAuthStore.getState();
        console.log("Sign In - Store State after 100ms:", {
          hasToken: !!storeState.token,
          tokenLength: storeState.token?.length,
          isAuthenticated: storeState.isAuthenticated,
          userEmail: storeState.user?.email,
        });
      }, 100);

      toast.success("Welcome back!", {
        description: "You have successfully signed in.",
      });

      // Use replace instead of push to prevent back button issues
      router.replace("/");
    } catch (error) {
      toast.error("Sign in failed", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="text-muted-foreground">
          Enter your credentials to access the dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="pl-10 h-11"
              error={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password here"
              className="pl-10 pr-10 h-11"
              error={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setValue("rememberMe", checked === true)
              }
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember me
            </label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#3EADC0] hover:bg-[#35a0b3] text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Doesn&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
