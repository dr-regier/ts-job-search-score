"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, User } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job Assistant</h1>

        <nav className="flex gap-2">
          <Button
            variant={pathname === "/" ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Chat
            </Link>
          </Button>

          <Button
            variant={pathname === "/profile" ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Link>
          </Button>
        </nav>
      </div>
    </div>
  );
}
