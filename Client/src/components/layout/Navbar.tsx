"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  Settings,
  Feather,
  BookOpenText,
  PlusCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../ThemeToggle";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          <Feather size={28} />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant={pathname === "/" ? "secondary" : "ghost"} asChild>
            <Link href="/">
              <BookOpenText className="mr-2 h-4 w-4" />Refresh Posts
            </Link>
          </Button>
          {loading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          ) : user ? (
            <>
              <Button
                variant={pathname === "/create-post" ? "secondary" : "ghost"}
                asChild
              >
                <Link href="/create-post">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Post
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user.name}!
              </span>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="User menu"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User size={16} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <LogOut size={16} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant={pathname === "/login" ? "secondary" : "ghost"}
                asChild
              >
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/register">
                  <UserPlus className="mr-2 h-4 w-4" /> Register
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
