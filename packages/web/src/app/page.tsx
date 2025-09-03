import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Terminal, Zap, Shield, Users } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-600/20 text-purple-300 border-purple-500/30">
            🚀 Now with AWS Bedrock Integration
          </Badge>
          <h1 className="text-6xl font-bold text-white mb-6">
            ECOSYSTEMCL.AI
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The world's most advanced multi-agent development platform. Deploy autonomous AI teams that code, test, review, and deploy - all while you sleep.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Download className="mr-2 h-5 w-5" />
              Download CLI
            </Button>
            <Button size="lg" variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-600/20">
              <Terminal className="mr-2 h-5 w-5" />
              Try Web App
            </Button>
          </div>

          {/* Demo Video/GIF Placeholder */}
          <div className="bg-slate-800 rounded-lg p-8 max-w-4xl mx-auto">
            <div className="bg-black rounded-lg p-4 font-mono text-green-400 text-sm">
              <div className="mb-2">$ forge task "Build a React dashboard with authentication"</div>
              <div className="text-gray-500">🤖 Orchestrator: Analyzing requirements...</div>
              <div className="text-gray-500">🏗️  Architect: Designing component structure...</div>
              <div className="text-gray-500">⚡ CodeGen: Implementing components...</div>
              <div className="text-gray-500">🧪 TestWriter: Creating test suites...</div>
              <div className="text-gray-500">🔍 Reviewer: Security audit complete...</div>
              <div className="text-green-400">✅ Task completed in 3.2 minutes</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Zap className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Parallel agent execution with intelligent caching. 10x faster than traditional development.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Enterprise Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">AWS native integration, SOC2 compliance, and your data never leaves your infrastructure.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">Shared workspaces, agent marketplace, and real-time collaboration across your entire team.</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
          <p className="text-gray-300 mb-12">Start free, scale as you grow</p>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Tier */}
            <Card className="bg-slate-800/50 border-slate-700 relative">
              <CardHeader>
                <CardTitle className="text-white">Starter</CardTitle>
                <CardDescription className="text-2xl font-bold text-white">
                  Free
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  10K credits/month
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  3 basic agents
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  1GB cloud storage
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="bg-slate-800/50 border-purple-500 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-white">Pro</CardTitle>
                <CardDescription className="text-2xl font-bold text-white">
                  $49<span className="text-sm text-gray-400">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  1M credits/month
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  All 12 agents
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  50GB cloud storage
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Priority queue
                </div>
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>

            {/* Team Tier */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Team</CardTitle>
                <CardDescription className="text-2xl font-bold text-white">
                  $149<span className="text-sm text-gray-400">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  5M credits/month
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Custom agents
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  500GB storage
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Team collaboration
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="bg-slate-800/50 border-yellow-500">
              <CardHeader>
                <CardTitle className="text-white">Enterprise</CardTitle>
                <CardDescription className="text-2xl font-bold text-white">
                  Custom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Unlimited credits
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  AWS Bedrock native
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Dedicated infrastructure
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  24/7 support
                </div>
                <Button className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Agent Showcase */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Meet Your AI Team</h2>
          <p className="text-gray-300 mb-12">Specialized agents for every development task</p>
          
          <div className="grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[
              { name: "Orchestrator", desc: "Plans and coordinates", tier: "Free" },
              { name: "CodeGen", desc: "Writes production code", tier: "Free" },
              { name: "TestWriter", desc: "Creates comprehensive tests", tier: "Free" },
              { name: "SecurityAuditor", desc: "Finds vulnerabilities", tier: "Pro" },
              { name: "UIArchitect", desc: "Designs interfaces", tier: "Pro" },
              { name: "DatabaseExpert", desc: "Optimizes queries", tier: "Pro" },
              { name: "DevOpsManager", desc: "Handles deployments", tier: "Team" },
              { name: "PerformanceOptimizer", desc: "Speeds up code", tier: "Team" },
            ].map((agent, i) => (
              <Card key={i} className="bg-slate-800/30 border-slate-600 text-center">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    🤖
                  </div>
                  <CardTitle className="text-sm text-white">{agent.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400 mb-2">{agent.desc}</p>
                  <Badge variant="outline" className="text-xs">
                    {agent.tier}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to 10x Your Development Speed?</h2>
          <p className="text-gray-300 mb-8">Join thousands of developers already using ECOSYSTEMCL.AI</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Watch Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
