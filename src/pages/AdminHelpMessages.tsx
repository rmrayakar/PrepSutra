import { useEffect, useState } from "react";
import {
  fetchHelpMessages,
  updateHelpMessage,
  markHelpMessageRead,
  countUnreadHelpMessages,
  deleteHelpMessage,
} from "@/integrations/supabase/functions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import React from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const statusMeta = {
  open: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Open" },
  in_progress: {
    color: "bg-blue-100 text-blue-800",
    icon: RefreshCw,
    label: "In Progress",
  },
  closed: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Closed",
  },
};

export default function AdminHelpMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAll();
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await countUnreadHelpMessages();
      setUnreadCount(count);
    } catch {}
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await fetchHelpMessages();
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch help messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpen = async (msg: any) => {
    setSelected(msg);
    setStatus(msg.status);
    if (!msg.read) {
      await markHelpMessageRead(msg.id);
      fetchAll();
      fetchUnreadCount();
    }
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    try {
      await updateHelpMessage(selected.id, { status });
      toast({ title: "Status updated" });
      setSelected(null);
      fetchAll();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const filtered = messages.filter(
    (msg) =>
      (!showUnreadOnly || !msg.read) &&
      (msg.name.toLowerCase().includes(search.toLowerCase()) ||
        msg.email.toLowerCase().includes(search.toLowerCase()) ||
        msg.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <Card className="max-w-5xl mx-auto mt-8">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>
                Help Messages
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  {unreadCount} Unread
                </span>
              </CardTitle>
              <div className="flex gap-2 items-center">
                <div className="relative w-64">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <Input
                    placeholder="Search by name, email, or subject"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRefreshing(true);
                    fetchAll();
                  }}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={
                      refreshing ? "animate-spin mr-2 h-4 w-4" : "mr-2 h-4 w-4"
                    }
                  />
                  Refresh
                </Button>
                <Button
                  variant={showUnreadOnly ? "default" : "outline"}
                  onClick={() => setShowUnreadOnly((v) => !v)}
                >
                  {showUnreadOnly ? "Show All" : "Show Unread"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No help messages found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((msg, i) => {
                        const meta = statusMeta[msg.status] || statusMeta.open;
                        return (
                          <TableRow
                            key={msg.id}
                            className={
                              (i % 2 === 0 ? "bg-muted/50 " : "") +
                              (!msg.read ? "border-l-4 border-blue-500" : "")
                            }
                          >
                            <TableCell className="font-medium flex items-center gap-2">
                              {!msg.read && (
                                <span
                                  className="inline-block w-2 h-2 rounded-full bg-blue-500"
                                  title="Unread"
                                />
                              )}
                              {msg.name}
                            </TableCell>
                            <TableCell>
                              <a
                                href={`mailto:${msg.email}`}
                                className="flex items-center gap-2 hover:underline"
                              >
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {msg.email}
                              </a>
                            </TableCell>
                            <TableCell>{msg.subject}</TableCell>
                            <TableCell>
                              <Badge className={`gap-1 ${meta.color}`}>
                                {React.createElement(meta.icon, {
                                  className: "h-4 w-4",
                                })}
                                {meta.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(msg.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpen(msg)}
                              >
                                View
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await deleteHelpMessage(msg.id);
                                    toast({ title: "Message deleted" });
                                    fetchAll();
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description:
                                        error.message ||
                                        "Failed to delete message.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                aria-label="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Message Details Modal */}
          <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Help Message Details</DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold">Name:</span> {selected.name}
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    {selected.email}
                  </div>
                  <div>
                    <span className="font-semibold">Subject:</span>{" "}
                    {selected.subject}
                  </div>
                  <div>
                    <span className="font-semibold">Message:</span>
                    <div className="bg-muted rounded p-2 mt-1 whitespace-pre-line max-h-40 overflow-y-auto">
                      {selected.message}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>
                    <div className="mt-1 flex gap-2">
                      {Object.keys(statusMeta).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={status === s ? "default" : "outline"}
                          onClick={() => setStatus(s)}
                        >
                          {React.createElement(statusMeta[s].icon, {
                            className: "h-4 w-4 mr-1",
                          })}
                          {statusMeta[s].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={status === selected?.status}
                >
                  Update Status
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
