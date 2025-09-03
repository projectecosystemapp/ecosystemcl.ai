import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const agents = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    description: "Master planner that analyzes requirements and coordinates other agents",
    icon: "🎯",
    tier: "Free",
    capabilities: ["Task planning", "Agent coordination", "Dependency management"],
    pricing: "10 credits per plan",
    category: "Core"
  },
  {
    id: "code-generator",
    name: "Code Generator", 
    description: "Writes production-ready code in any language with best practices",
    icon: "⚡",
    tier: "Free",
    capabilities: ["Multi-language support", "Best practices", "Documentation"],
    pricing: "50 credits per file",
    category: "Development"
  },
  {
    id: "security-auditor",
    name: "Security Auditor",
    description: "Scans code for vulnerabilities and security best practices",
    icon: "🛡️",
    tier: "Pro",
    capabilities: ["OWASP scanning", "Dependency audit", "Security recommendations"],
    pricing: "100 credits per audit",
    category: "Security"
  },
  {
    id: "ui-architect",
    name: "UI Architect",
    description: "Designs beautiful, responsive user interfaces",
    icon: "🎨",
    tier: "Pro",
    capabilities: ["Component design", "Responsive layouts", "Accessibility"],
    pricing: "75 credits per component",
    category: "Design"
  },
  {
    id: "devops-manager",
    name: "DevOps Manager",
    description: "Handles CI/CD, deployments, and infrastructure as code",
    icon: "🚀",
    tier: "Team",
    capabilities: ["CI/CD pipelines", "Docker containers", "Cloud deployment"],
    pricing: "150 credits per deployment",
    category: "Operations"
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    description: "Analyzes data, builds ML models, and creates insights",
    icon: "📊",
    tier: "Enterprise",
    capabilities: ["Data analysis", "ML models", "Visualization"],
    pricing: "300 credits per model",
    category: "AI/ML"
  }
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Agent Marketplace</h1>
          <p className="text-xl text-gray-300 mb-8">Specialized AI agents for every development task</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{agent.icon}</div>
                  <Badge variant="outline" className="text-purple-400 border-purple-500">
                    {agent.tier}
                  </Badge>
                </div>
                <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                <CardDescription className="text-gray-300 text-sm">
                  {agent.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((capability, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-gray-400 border-gray-600">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{agent.pricing}</span>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Try Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}