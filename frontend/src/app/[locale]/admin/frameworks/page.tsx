"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Layers,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  ArrowUpDown,
} from "lucide-react";

interface Framework {
  id: string;
  name: string;
  code: string;
  version: string;
  indicators: number;
  status: "active" | "inactive";
  description: string;
}

const mockFrameworks: Framework[] = [
  {
    id: "1",
    name: "GRI Standards",
    code: "GRI",
    version: "v2024",
    indicators: 120,
    status: "active",
    description: "Global Reporting Initiative universal standards for sustainability reporting",
  },
  {
    id: "2",
    name: "SASB Standards",
    code: "SASB",
    version: "v2023",
    indicators: 77,
    status: "active",
    description: "Industry-specific sustainability accounting standards",
  },
  {
    id: "3",
    name: "TCFD Recommendations",
    code: "TCFD",
    version: "v2023",
    indicators: 11,
    status: "active",
    description: "Task Force on Climate-Related Financial Disclosures",
  },
  {
    id: "4",
    name: "CDP Questionnaire",
    code: "CDP",
    version: "v2024",
    indicators: 45,
    status: "active",
    description: "Carbon Disclosure Project environmental impact questionnaire",
  },
  {
    id: "5",
    name: "Sustainable Development Goals",
    code: "SDGs",
    version: "v2030",
    indicators: 169,
    status: "active",
    description: "United Nations 17 goals for global sustainable development",
  },
];

export default function FrameworksAdminPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredFrameworks = mockFrameworks.filter(
    (fw) =>
      fw.name.toLowerCase().includes(search.toLowerCase()) ||
      fw.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalIndicators = mockFrameworks.reduce((sum, fw) => sum + fw.indicators, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-brand-blue" />
            {t("admin.nav.frameworks")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage ESG reporting frameworks and their indicators
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Add Framework
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand-blue" />
                Add New Framework
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fw-name">Framework Name</Label>
                  <Input id="fw-name" placeholder="e.g. GRI Standards" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fw-code">Code</Label>
                  <Input id="fw-code" placeholder="e.g. GRI" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fw-version">Version</Label>
                  <Input id="fw-version" placeholder="e.g. v2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fw-indicators">Number of Indicators</Label>
                  <Input id="fw-indicators" type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fw-desc">Description</Label>
                <Input id="fw-desc" placeholder="Brief description of the framework" />
              </div>
              <Separator />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDialogOpen(false)} className="font-semibold">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Framework
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-blue/10">
                <Layers className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockFrameworks.length}</p>
                <p className="text-xs text-muted-foreground">Total Frameworks</p>
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
                <p className="text-2xl font-bold">
                  {mockFrameworks.filter((fw) => fw.status === "active").length}
                </p>
                <p className="text-xs text-muted-foreground">Active Frameworks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-gold/10">
                <ArrowUpDown className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalIndicators}</p>
                <p className="text-xs text-muted-foreground">Total Indicators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">All Frameworks</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search frameworks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Version</TableHead>
                  <TableHead className="font-semibold text-center">Indicators</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFrameworks.map((fw) => (
                  <TableRow key={fw.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{fw.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                          {fw.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {fw.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fw.version}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-sm">{fw.indicators}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {fw.status === "active" ? (
                        <Badge variant="secondary" className="text-brand-green bg-brand-green/10">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-destructive bg-destructive/10">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFrameworks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No frameworks found matching your search.
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
