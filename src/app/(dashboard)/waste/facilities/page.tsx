"use client";

import { useEffect } from "react";

export default function FacilitiesPage() {
  useEffect(() => {
    window.location.href = "http://localhost:3002";
  }, []);

  return null;
}
