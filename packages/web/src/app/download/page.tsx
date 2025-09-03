import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Terminal, Globe, Copy, CheckCircle } from "lucide-react";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Download ECOSYSTEMCL.AI</h1>
          <p className="text-xl text-gray-300 mb-8">
            Get started with the most powerful AI development platform
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Terminal className="h-8 w-8 text-purple-400" />
                <div>
                  <CardTitle className="text-white text-2xl">ECOSYSTEMCL.AI CLI</CardTitle>
                  <CardDescription className="text-gray-300">
                    Command-line interface for power users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Quick Install</h3>
                <div className="bg-black rounded-lg p-4 font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">curl -fsSL https://forge.ai/install.sh | bash</span>
                    <Button size="sm" variant="outline" className="ml-2">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">Manual Downloads</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-purple-600 hover:bg-purple-700 justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    macOS
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Windows
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Linux
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Docker
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-semibold">Features</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    Full agent orchestration
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    Local and cloud execution
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    Git integration
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Globe className="h-8 w-8 text-blue-400" />
                <div>
                  <CardTitle className="text-white text-2xl">Web Application</CardTitle>
                  <CardDescription className="text-gray-300">
                    Full-featured browser interface
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full">
                  <Globe className="mr-2 h-5 w-5" />
                  Launch Web App
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-semibold">Features</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    Visual dashboard
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    Team collaboration
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    Real-time monitoring
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
