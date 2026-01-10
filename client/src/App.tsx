import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import Overview from "@/pages/Overview";
import Documents from "@/pages/Documents";
import Assessments from "@/pages/Assessments";
import AssessmentDetail from "@/pages/AssessmentDetail";
import ControlDetail from "@/pages/ControlDetail";
import Findings from "@/pages/Findings";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/overview" />
      </Route>
      <Route path="/overview" component={Overview} />
      <Route path="/documents" component={Documents} />
      <Route path="/assessments" component={Assessments} />
      <Route path="/assessments/:id" component={AssessmentDetail} />
      <Route path="/assessments/:id/controls/:control_id" component={ControlDetail} />
      <Route path="/findings" component={Findings} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppShell>
          <Router />
        </AppShell>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
