import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface StudyTask {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
}

interface StudyPlanGenerator {
  examDate: string;
  dailyHours: string;
  focusAreas: {
    gs1: boolean;
    gs2: boolean;
    gs3: boolean;
    gs4: boolean;
    essay: boolean;
    optional: boolean;
  };
  optionalSubject?: string;
}

const Planner = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    start_date: new Date().toISOString(),
    end_date: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
    plan_id: "",
  });
  const [generatorForm, setGeneratorForm] = useState<StudyPlanGenerator>({
    examDate: "",
    dailyHours: "6-8",
    focusAreas: {
      gs1: true,
      gs2: true,
      gs3: true,
      gs4: true,
      essay: true,
      optional: false,
    },
    optionalSubject: "",
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showDeletePlanDialog, setShowDeletePlanDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<StudyTask[]>([]);

  useEffect(() => {
    fetchStudyPlans();
  }, [user]);

  const fetchStudyPlans = async () => {
    try {
      const { data: plans, error: plansError } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;
      setStudyPlans(plans || []);

      if (plans && plans.length > 0) {
        fetchTasks(plans[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching study plans:", error);
      toast.error("Error fetching study plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const convertToIST = (date: Date): Date => {
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  };

  const formatISTDate = (date: Date): string => {
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = convertToIST(new Date(dateString));
    return {
      date: date.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const fetchTasks = async (planId: string) => {
    try {
      setSelectedPlanId(planId);
      const { data: tasks, error: tasksError } = await supabase
        .from("study_tasks")
        .select("*")
        .eq("plan_id", planId)
        .order("due_date", { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(
        (tasks || []).map((task) => ({
          ...task,
          priority: task.priority as "low" | "medium" | "high",
          status: task.status as "pending" | "in_progress" | "completed",
        }))
      );
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Error fetching tasks: " + error.message);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const { data: plan, error } = await supabase
        .from("study_plans")
        .insert({
          user_id: user?.id,
          title: newPlan.title,
          description: newPlan.description,
          start_date: newPlan.start_date,
          end_date: newPlan.end_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Study plan created successfully");
      setShowNewPlanDialog(false);
      setNewPlan({
        title: "",
        description: "",
        start_date: new Date().toISOString(),
        end_date: "",
      });
      fetchStudyPlans();
    } catch (error: any) {
      console.error("Error creating study plan:", error);
      toast.error("Error creating study plan: " + error.message);
    }
  };

  const handleCreateTask = async () => {
    try {
      if (!newTask.plan_id) {
        toast.error("Please select a study plan");
        return;
      }

      if (!newTask.title.trim()) {
        toast.error("Please enter a task title");
        return;
      }

      const { data: task, error } = await supabase
        .from("study_tasks")
        .insert({
          plan_id: newTask.plan_id,
          title: newTask.title.trim(),
          description: newTask.description?.trim() || null,
          due_date: newTask.due_date || null,
          priority: newTask.priority,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Task created successfully");
      setShowNewTaskDialog(false);
      setNewTask({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        plan_id: "",
      });
      fetchTasks(newTask.plan_id);
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error("Error creating task: " + error.message);
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: "pending" | "in_progress" | "completed"
  ) => {
    try {
      const { error } = await supabase
        .from("study_tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Task status updated successfully");
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);
    } catch (error: any) {
      console.error("Error updating task status:", error);
      toast.error("Error updating task status: " + error.message);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      if (!generatorForm.examDate) {
        toast.error("Please select an exam date");
        return;
      }

      const selectedAreas = Object.entries(generatorForm.focusAreas)
        .filter(([_, selected]) => selected)
        .map(([area]) => area);

      if (selectedAreas.length === 0) {
        toast.error("Please select at least one focus area");
        return;
      }

      if (generatorForm.focusAreas.optional && !generatorForm.optionalSubject) {
        toast.error("Please specify your optional subject");
        return;
      }

      const examDate = convertToIST(new Date(generatorForm.examDate));
      const today = convertToIST(new Date());
      const daysUntilExam = Math.ceil(
        (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExam <= 0) {
        toast.error("Exam date must be in the future");
        return;
      }

      // Create the main study plan
      const { data: plan, error: planError } = await supabase
        .from("study_plans")
        .insert({
          user_id: user?.id,
          title: "UPSC Preparation Plan",
          description: `Comprehensive study plan for UPSC preparation covering ${selectedAreas.join(
            ", "
          )}${
            generatorForm.optionalSubject
              ? ` with ${generatorForm.optionalSubject} as optional subject`
              : ""
          }`,
          start_date: today.toISOString(),
          end_date: examDate.toISOString(),
        })
        .select()
        .single();

      if (planError) throw planError;

      // Calculate available study hours per day
      const [minHours, maxHours] = generatorForm.dailyHours
        .split("-")
        .map(Number);
      const avgHoursPerDay = (minHours + maxHours) / 2;

      // Define task types and their weights
      const taskTypes = {
        initialReading: { weight: 0.4, duration: 2 }, // 40% of time, 2 hours per session
        practice: { weight: 0.3, duration: 1.5 }, // 30% of time, 1.5 hours per session
        revision: { weight: 0.3, duration: 1 }, // 30% of time, 1 hour per session
      };

      // Calculate total available study hours
      const totalStudyHours = daysUntilExam * avgHoursPerDay;

      // Generate tasks based on focus areas with better distribution
      const tasks = [];
      const subjectWeights = {
        gs1: 1.2, // Slightly more weight for GS1
        gs2: 1.2, // Slightly more weight for GS2
        gs3: 1.2, // Slightly more weight for GS3
        gs4: 1.2, // Slightly more weight for GS4
        essay: 1.0, // Normal weight for Essay
        optional: 1.5, // Higher weight for Optional subject
      };

      // Calculate total weight
      const totalWeight = selectedAreas.reduce(
        (sum, area) => sum + (subjectWeights[area] || 1),
        0
      );

      // Distribute tasks for each subject
      for (const area of selectedAreas) {
        const subjectName = {
          gs1: "General Studies Paper I",
          gs2: "General Studies Paper II",
          gs3: "General Studies Paper III",
          gs4: "General Studies Paper IV",
          essay: "Essay Writing",
          optional: generatorForm.optionalSubject || "Optional Subject",
        }[area];

        const subjectWeight = subjectWeights[area] || 1;
        const subjectHours = (totalStudyHours * subjectWeight) / totalWeight;

        // Calculate number of tasks for each type
        const initialReadingTasks = Math.ceil(
          (subjectHours * taskTypes.initialReading.weight) /
            taskTypes.initialReading.duration
        );
        const practiceTasks = Math.ceil(
          (subjectHours * taskTypes.practice.weight) /
            taskTypes.practice.duration
        );
        const revisionTasks = Math.ceil(
          (subjectHours * taskTypes.revision.weight) /
            taskTypes.revision.duration
        );

        // Distribute tasks evenly across the timeline
        const distributeTasks = (count, type, duration) => {
          const interval = daysUntilExam / (count + 1);
          for (let i = 1; i <= count; i++) {
            const dueDate = convertToIST(
              new Date(today.getTime() + interval * i * 24 * 60 * 60 * 1000)
            );

            let title, description;
            switch (type) {
              case "initialReading":
                title = `${subjectName} - Initial Reading ${i}/${count}`;
                description = `Complete initial reading of ${subjectName} syllabus - Part ${i}`;
                break;
              case "practice":
                title = `${subjectName} - Practice Questions ${i}/${count}`;
                description = `Solve practice questions and previous year papers for ${subjectName} - Set ${i}`;
                break;
              case "revision":
                title = `${subjectName} - Revision ${i}/${count}`;
                description = `Complete revision of ${subjectName} notes and important topics - Part ${i}`;
                break;
            }

            tasks.push({
              plan_id: plan.id,
              title,
              description,
              due_date: dueDate.toISOString(),
              priority:
                type === "revision"
                  ? "high"
                  : type === "initialReading"
                  ? "medium"
                  : "low",
              status: "pending",
            });
          }
        };

        distributeTasks(
          initialReadingTasks,
          "initialReading",
          taskTypes.initialReading.duration
        );
        distributeTasks(practiceTasks, "practice", taskTypes.practice.duration);
        distributeTasks(revisionTasks, "revision", taskTypes.revision.duration);
      }

      // Sort tasks by due date
      tasks.sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );

      // Insert all tasks
      const { error: tasksError } = await supabase
        .from("study_tasks")
        .insert(tasks);

      if (tasksError) throw tasksError;

      toast.success("Study plan generated successfully!");
      setShowGeneratorDialog(false);
      fetchStudyPlans();
    } catch (error: any) {
      console.error("Error generating study plan:", error);
      toast.error("Error generating study plan: " + error.message);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      const { error } = await supabase
        .from("study_plans")
        .delete()
        .eq("id", planToDelete);

      if (error) throw error;

      toast.success("Study plan deleted successfully");
      setShowDeletePlanDialog(false);
      setPlanToDelete(null);
      if (selectedPlanId === planToDelete) {
        setSelectedPlanId(null);
        setTasks([]);
      }
      fetchStudyPlans();
    } catch (error: any) {
      console.error("Error deleting study plan:", error);
      toast.error("Error deleting study plan: " + error.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from("study_tasks")
        .delete()
        .eq("id", taskToDelete);

      if (error) throw error;

      toast.success("Task deleted successfully");
      setShowDeleteTaskDialog(false);
      setTaskToDelete(null);
      if (selectedPlanId) {
        fetchTasks(selectedPlanId);
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error("Error deleting task: " + error.message);
    }
  };

  // Add this new function to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const istDate = convertToIST(date);
    return tasks.filter((task) => {
      const taskDate = convertToIST(new Date(task.due_date));
      return (
        taskDate.getDate() === istDate.getDate() &&
        taskDate.getMonth() === istDate.getMonth() &&
        taskDate.getFullYear() === istDate.getFullYear()
      );
    });
  };

  // Add this new function to get task indicators for the calendar
  const getTaskIndicators = (date: Date) => {
    const istDate = convertToIST(date);
    const dateTasks = getTasksForDate(istDate);
    if (dateTasks.length === 0) return null;

    const highPriority = dateTasks.filter(
      (task) => task.priority === "high"
    ).length;
    const mediumPriority = dateTasks.filter(
      (task) => task.priority === "medium"
    ).length;
    const lowPriority = dateTasks.filter(
      (task) => task.priority === "low"
    ).length;

    return (
      <div className="flex gap-1 justify-center mt-1">
        {highPriority > 0 && (
          <div
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            title={`${highPriority} high priority tasks`}
          />
        )}
        {mediumPriority > 0 && (
          <div
            className="w-1.5 h-1.5 rounded-full bg-amber-500"
            title={`${mediumPriority} medium priority tasks`}
          />
        )}
        {lowPriority > 0 && (
          <div
            className="w-1.5 h-1.5 rounded-full bg-green-500"
            title={`${lowPriority} low priority tasks`}
          />
        )}
      </div>
    );
  };

  // Update the date selection handler
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const istDate = convertToIST(newDate);
      setDate(istDate);
      setSelectedDateTasks(getTasksForDate(istDate));
    } else {
      setDate(undefined);
      setSelectedDateTasks([]);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Smart Study Planner
              </h2>
              <p className="text-muted-foreground mt-2">
                Generate personalized study plans and manage your daily targets
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>
                    Select a date to view or plan tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[320px]">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        className="rounded-md border shadow-sm pointer-events-auto"
                        components={{
                          DayContent: ({ date }) => (
                            <div className="flex flex-col items-center ">
                              <span>{date.getDate()}</span>
                              {getTaskIndicators(date)}
                            </div>
                          ),
                        }}
                      />
                    </div>
                  </div>
                  {selectedDateTasks.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-[700px] overflow-y-auto">
                      <h3 className="font-medium">
                        Tasks for {date?.toLocaleDateString()}
                      </h3>
                      {selectedDateTasks.map((task) => (
                        <div key={task.id} className="p-2 rounded-md border">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{task.title}</span>
                            <span
                              className={`text-xs py-1 px-2 rounded-full ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : task.priority === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {task.priority.charAt(0).toUpperCase() +
                                task.priority.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="md:col-span-8 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Study Plans</CardTitle>
                    <CardDescription>Manage your study plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Dialog
                          open={showNewPlanDialog}
                          onOpenChange={setShowNewPlanDialog}
                        >
                          <DialogTrigger asChild>
                            <Button>Create New Plan</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Study Plan</DialogTitle>
                              <DialogDescription>
                                Create a new study plan to organize your
                                preparation
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="Plan Title"
                                value={newPlan.title}
                                onChange={(e) =>
                                  setNewPlan({
                                    ...newPlan,
                                    title: e.target.value,
                                  })
                                }
                              />
                              <Textarea
                                placeholder="Plan Description"
                                value={newPlan.description}
                                onChange={(e) =>
                                  setNewPlan({
                                    ...newPlan,
                                    description: e.target.value,
                                  })
                                }
                              />
                              <Input
                                type="date"
                                value={newPlan.start_date.split("T")[0]}
                                onChange={(e) =>
                                  setNewPlan({
                                    ...newPlan,
                                    start_date: new Date(
                                      e.target.value
                                    ).toISOString(),
                                  })
                                }
                              />
                              <Input
                                type="date"
                                value={newPlan.end_date.split("T")[0]}
                                onChange={(e) =>
                                  setNewPlan({
                                    ...newPlan,
                                    end_date: new Date(
                                      e.target.value
                                    ).toISOString(),
                                  })
                                }
                              />
                            </div>
                            <DialogFooter>
                              <Button onClick={handleCreatePlan}>
                                Create Plan
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={showGeneratorDialog}
                          onOpenChange={setShowGeneratorDialog}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              Generate Smart Plan
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Generate Smart Study Plan
                              </DialogTitle>
                              <DialogDescription>
                                Create a personalized study plan based on your
                                preferences
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Exam Date</Label>
                                <Input
                                  type="date"
                                  value={generatorForm.examDate}
                                  onChange={(e) =>
                                    setGeneratorForm({
                                      ...generatorForm,
                                      examDate: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div>
                                <Label>Daily Study Hours</Label>
                                <Select
                                  value={generatorForm.dailyHours}
                                  onValueChange={(value) =>
                                    setGeneratorForm({
                                      ...generatorForm,
                                      dailyHours: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="4-6">
                                      4-6 hours
                                    </SelectItem>
                                    <SelectItem value="6-8">
                                      6-8 hours
                                    </SelectItem>
                                    <SelectItem value="8-10">
                                      8-10 hours
                                    </SelectItem>
                                    <SelectItem value="10+">
                                      10+ hours
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Focus Areas</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="gs1"
                                      checked={generatorForm.focusAreas.gs1}
                                      onCheckedChange={(checked) =>
                                        setGeneratorForm({
                                          ...generatorForm,
                                          focusAreas: {
                                            ...generatorForm.focusAreas,
                                            gs1: checked as boolean,
                                          },
                                        })
                                      }
                                    />
                                    <Label htmlFor="gs1">GS Paper I</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="gs2"
                                      checked={generatorForm.focusAreas.gs2}
                                      onCheckedChange={(checked) =>
                                        setGeneratorForm({
                                          ...generatorForm,
                                          focusAreas: {
                                            ...generatorForm.focusAreas,
                                            gs2: checked as boolean,
                                          },
                                        })
                                      }
                                    />
                                    <Label htmlFor="gs2">GS Paper II</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="gs3"
                                      checked={generatorForm.focusAreas.gs3}
                                      onCheckedChange={(checked) =>
                                        setGeneratorForm({
                                          ...generatorForm,
                                          focusAreas: {
                                            ...generatorForm.focusAreas,
                                            gs3: checked as boolean,
                                          },
                                        })
                                      }
                                    />
                                    <Label htmlFor="gs3">GS Paper III</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="gs4"
                                      checked={generatorForm.focusAreas.gs4}
                                      onCheckedChange={(checked) =>
                                        setGeneratorForm({
                                          ...generatorForm,
                                          focusAreas: {
                                            ...generatorForm.focusAreas,
                                            gs4: checked as boolean,
                                          },
                                        })
                                      }
                                    />
                                    <Label htmlFor="gs4">GS Paper IV</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="essay"
                                      checked={generatorForm.focusAreas.essay}
                                      onCheckedChange={(checked) =>
                                        setGeneratorForm({
                                          ...generatorForm,
                                          focusAreas: {
                                            ...generatorForm.focusAreas,
                                            essay: checked as boolean,
                                          },
                                        })
                                      }
                                    />
                                    <Label htmlFor="essay">Essay</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="optional"
                                      checked={
                                        generatorForm.focusAreas.optional
                                      }
                                      onCheckedChange={(checked) =>
                                        setGeneratorForm({
                                          ...generatorForm,
                                          focusAreas: {
                                            ...generatorForm.focusAreas,
                                            optional: checked as boolean,
                                          },
                                        })
                                      }
                                    />
                                    <Label htmlFor="optional">Optional</Label>
                                  </div>
                                </div>
                              </div>

                              {generatorForm.focusAreas.optional && (
                                <div>
                                  <Label>Optional Subject</Label>
                                  <Input
                                    placeholder="Enter your optional subject"
                                    value={generatorForm.optionalSubject}
                                    onChange={(e) =>
                                      setGeneratorForm({
                                        ...generatorForm,
                                        optionalSubject: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button onClick={handleGeneratePlan}>
                                Generate Plan
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-4">
                        {studyPlans.map((plan) => (
                          <div key={plan.id} className="rounded-md border p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{plan.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {plan.description}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                    {new Date(
                                      plan.start_date
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {plan.end_date
                                      ? new Date(
                                          plan.end_date
                                        ).toLocaleDateString()
                                      : "Ongoing"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => fetchTasks(plan.id)}
                                  className={
                                    selectedPlanId === plan.id
                                      ? "bg-white text-prepsutra-primary border-prepsutra-primary hover:bg-white/90"
                                      : "bg-prepsutra-primary text-white hover:bg-prepsutra-primary/90"
                                  }
                                >
                                  View Tasks
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setPlanToDelete(plan.id);
                                    setShowDeletePlanDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Task Schedule</CardTitle>
                      {/* <CardDescription>
                        {date
                          ? date.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "No date selected"}
                      </CardDescription> */}
                    </div>
                    <Dialog
                      open={showNewTaskDialog}
                      onOpenChange={setShowNewTaskDialog}
                    >
                      <DialogTrigger asChild>
                        <Button disabled={!selectedPlanId}>Add Task</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                          <DialogDescription>
                            Create a new task for your study plan
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select
                            value={newTask.plan_id}
                            onValueChange={(value) =>
                              setNewTask({ ...newTask, plan_id: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Study Plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {studyPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Task Title"
                            value={newTask.title}
                            onChange={(e) =>
                              setNewTask({ ...newTask, title: e.target.value })
                            }
                          />
                          <Textarea
                            placeholder="Task Description"
                            value={newTask.description}
                            onChange={(e) =>
                              setNewTask({
                                ...newTask,
                                description: e.target.value,
                              })
                            }
                          />
                          <Input
                            type="datetime-local"
                            value={newTask.due_date}
                            onChange={(e) =>
                              setNewTask({
                                ...newTask,
                                due_date: e.target.value,
                              })
                            }
                          />
                          <Select
                            value={newTask.priority}
                            onValueChange={(value: "low" | "medium" | "high") =>
                              setNewTask({ ...newTask, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateTask}>
                            Create Task
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All Tasks</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="all"
                        className="space-y-4 max-h-[500px] overflow-y-auto"
                      >
                        {tasks.map((task) => {
                          const dueDate = formatDueDate(task.due_date);
                          return (
                            <div
                              key={task.id}
                              className="rounded-md border p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium">{task.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {task.description}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    {dueDate && (
                                      <div className="flex flex-col gap-1">
                                        <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                          {dueDate.date}
                                        </span>
                                        <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                          {dueDate.time}
                                        </span>
                                      </div>
                                    )}
                                    <span
                                      className={`text-xs py-1 px-2 rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-700"
                                          : task.priority === "medium"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-green-100 text-green-700"
                                      }`}
                                    >
                                      {task.priority.charAt(0).toUpperCase() +
                                        task.priority.slice(1)}{" "}
                                      Priority
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={task.status}
                                    onValueChange={(
                                      value:
                                        | "pending"
                                        | "in_progress"
                                        | "completed"
                                    ) => handleUpdateTaskStatus(task.id, value)}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">
                                        Pending
                                      </SelectItem>
                                      <SelectItem value="in_progress">
                                        In Progress
                                      </SelectItem>
                                      <SelectItem value="completed">
                                        Completed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setTaskToDelete(task.id);
                                      setShowDeleteTaskDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </TabsContent>
                      <TabsContent
                        value="pending"
                        className="space-y-4 max-h-[500px] overflow-y-auto"
                      >
                        {tasks
                          .filter((task) => task.status === "pending")
                          .map((task) => {
                            const dueDate = formatDueDate(task.due_date);
                            return (
                              <div
                                key={task.id}
                                className="rounded-md border p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-medium">
                                      {task.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {task.description}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                      {dueDate && (
                                        <div className="flex flex-col gap-1">
                                          <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                            {dueDate.date}
                                          </span>
                                          <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                            {dueDate.time}
                                          </span>
                                        </div>
                                      )}
                                      <span
                                        className={`text-xs py-1 px-2 rounded-full ${
                                          task.priority === "high"
                                            ? "bg-red-100 text-red-700"
                                            : task.priority === "medium"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {task.priority.charAt(0).toUpperCase() +
                                          task.priority.slice(1)}{" "}
                                        Priority
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={task.status}
                                      onValueChange={(
                                        value:
                                          | "pending"
                                          | "in_progress"
                                          | "completed"
                                      ) =>
                                        handleUpdateTaskStatus(task.id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                          In Progress
                                        </SelectItem>
                                        <SelectItem value="completed">
                                          Completed
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setTaskToDelete(task.id);
                                        setShowDeleteTaskDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </TabsContent>
                      <TabsContent
                        value="completed"
                        className="space-y-4 max-h-[500px] overflow-y-auto"
                      >
                        {tasks
                          .filter((task) => task.status === "completed")
                          .map((task) => {
                            const dueDate = formatDueDate(task.due_date);
                            return (
                              <div
                                key={task.id}
                                className="rounded-md border p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-medium">
                                      {task.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {task.description}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                      {dueDate && (
                                        <div className="flex flex-col gap-1">
                                          <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                            {dueDate.date}
                                          </span>
                                          <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                            {dueDate.time}
                                          </span>
                                        </div>
                                      )}
                                      <span
                                        className={`text-xs py-1 px-2 rounded-full ${
                                          task.priority === "high"
                                            ? "bg-red-100 text-red-700"
                                            : task.priority === "medium"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {task.priority.charAt(0).toUpperCase() +
                                          task.priority.slice(1)}{" "}
                                        Priority
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={task.status}
                                      onValueChange={(
                                        value:
                                          | "pending"
                                          | "in_progress"
                                          | "completed"
                                      ) =>
                                        handleUpdateTaskStatus(task.id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                          In Progress
                                        </SelectItem>
                                        <SelectItem value="completed">
                                          Completed
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setTaskToDelete(task.id);
                                        setShowDeleteTaskDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Plan Dialog */}
      <AlertDialog
        open={showDeletePlanDialog}
        onOpenChange={setShowDeletePlanDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Study Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this study plan? This action
              cannot be undone and will also delete all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Dialog */}
      <AlertDialog
        open={showDeleteTaskDialog}
        onOpenChange={setShowDeleteTaskDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Planner;
