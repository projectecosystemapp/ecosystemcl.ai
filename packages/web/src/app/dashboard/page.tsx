import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  CreditCard, 
  Download, 
  Play, 
  Settings, 
  Users, 
  Zap,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Mock data - replace with real data from your API
  const stats = {
    creditsUsed: 45230,
    creditsTotal: 1000000,
    jobsCompleted: 127,
    jobsRunning: 3,
    storageUsed: 12.4,
    storageTotal: 50,
  };

  const recentJobs = [
    { id: "1", command: "audit", status: "completed", agent: "SecurityAuditor", duration: "2m 34s", credits: 150 },
    { id: "2", command: "task", status: "running", agent: "CodeGenerator", duration: "1m 12s", credits: 75 },
    { id: "3", command: "test", status: "completed", agent: "TestWriter", duration: "45s", credits: 30 },
    { id: "4", command: "deploy", status: "failed", agent: "DevOpsManager", duration: "3m 21s", credits: 200 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-300">Welcome back! Here's what's happening with your agents.</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Play className="mr-2 h-4 w-4" />
              New Task
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Credits Used</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.creditsUsed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">
                of {stats.creditsTotal.toLocaleString()} total
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(stats.creditsUsed / stats.creditsTotal) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Jobs Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.jobsCompleted}</div>
              <p className="text-xs text-gray-400">
                {stats.jobsRunning} currently running
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Storage Used</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.storageUsed}GB</div>
              <p className="text-xs text-gray-400">
                of {stats.storageTotal}GB total
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.storageUsed / stats.storageTotal) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">8</div>
              <p className="text-xs text-gray-400">
                of 12 available
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Jobs */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Jobs</CardTitle>
                <CardDescription className="text-gray-300">
                  Your latest agent executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`
                          w-3 h-3 rounded-full
                          ${job.status === 'completed' ? 'bg-green-400' : ''}
                          ${job.status === 'running' ? 'bg-yellow-400 animate-pulse' : ''}
                          ${job.status === 'failed' ? 'bg-red-400' : ''}
                        `}></div>
                        <div>
                          <div className="text-white font-medium">{job.command}</div>
                          <div className="text-sm text-gray-400">{job.agent}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.duration}
                        </div>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          {job.credits}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${job.status === 'completed' ? 'border-green-500 text-green-400' : ''}
                            ${job.status === 'running' ? 'border-yellow-500 text-yellow-400' : ''}
                            ${job.status === 'failed' ? 'border-red-500 text-red-400' : ''}
                          `}
                        >
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                  <Play className="mr-2 h-4 w-4" />
                  Run Security Audit
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download CLI
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Agents
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Upgrade to Pro</CardTitle>
                <CardDescription className="text-gray-300">
                  Unlock all agents and advanced features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}