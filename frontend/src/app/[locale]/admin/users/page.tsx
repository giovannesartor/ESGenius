"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Pencil,
  Ban,
  Shield,
  User,
  Mail,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  MoreHorizontal,
} from "lucide-react";

type UserRole = "admin" | "user";
type UserStatus = "active" | "suspended";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  status: UserStatus;
  lastLogin: string;
  avatar: string;
}

const mockUsers: UserRecord[] = [
  {
    id: "1",
    name: "Maria Silva",
    email: "maria.silva@ecotech.com",
    role: "admin",
    company: "EcoTech Solutions",
    status: "active",
    lastLogin: "2 hours ago",
    avatar: "MS",
  },
  {
    id: "2",
    name: "Carlos Mendes",
    email: "carlos.mendes@greenmining.cl",
    role: "user",
    company: "Green Mining Corp",
    status: "active",
    lastLogin: "5 hours ago",
    avatar: "CM",
  },
  {
    id: "3",
    name: "Ana Costa",
    email: "ana.costa@sustainfin.de",
    role: "admin",
    company: "Sustainable Finance AG",
    status: "active",
    lastLogin: "1 day ago",
    avatar: "AC",
  },
  {
    id: "4",
    name: "Pedro Santos",
    email: "pedro.santos@agroverde.pt",
    role: "user",
    company: "AgroVerde Ltda",
    status: "suspended",
    lastLogin: "5 days ago",
    avatar: "PS",
  },
  {
    id: "5",
    name: "Lucas Oliveira",
    email: "lucas.oliveira@ecotech.com",
    role: "user",
    company: "EcoTech Solutions",
    status: "active",
    lastLogin: "12 hours ago",
    avatar: "LO",
  },
  {
    id: "6",
    name: "Sophie Weber",
    email: "sophie.weber@sustainfin.de",
    role: "user",
    company: "Sustainable Finance AG",
    status: "active",
    lastLogin: "3 hours ago",
    avatar: "SW",
  },
];

export default function UsersAdminPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.company.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalAdmins = mockUsers.filter((u) => u.role === "admin").length;
  const activeUsers = mockUsers.filter((u) => u.status === "active").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-blue" />
            {t("admin.nav.users")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Users className="mr-1.5 h-3 w-3" />
            {mockUsers.length} total users
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-blue/10">
                <Users className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockUsers.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-gold/10">
                <Shield className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAdmins}</p>
                <p className="text-xs text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-green/10">
                <CheckCircle className="h-5 w-5 text-brand-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base">All Users</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">Role:</span>
              {(["all", "admin", "user"] as const).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                  className="text-xs h-7"
                >
                  {role === "all" ? "All" : role === "admin" ? "Admin" : "User"}
                </Button>
              ))}
              <Separator orientation="vertical" className="h-4 mx-1" />
              <span className="text-xs text-muted-foreground mr-1">Status:</span>
              {(["all", "active", "suspended"] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="text-xs h-7"
                >
                  {status === "all" ? "All" : status === "active" ? "Active" : "Suspended"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold text-center">Role</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold">Last Login</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-xs font-semibold text-brand-blue">
                          {user.avatar}
                        </div>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[180px]">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.role === "admin" ? (
                        <Badge className="bg-brand-gold/10 text-brand-gold border-brand-gold/20">
                          <Shield className="mr-1 h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <User className="mr-1 h-3 w-3" />
                          User
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[150px]">{user.company}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.status === "active" ? (
                        <Badge variant="secondary" className="text-brand-green bg-brand-green/10">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-destructive bg-destructive/10">
                          <XCircle className="mr-1 h-3 w-3" />
                          Suspended
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {user.lastLogin}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive">
                          <Ban className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
