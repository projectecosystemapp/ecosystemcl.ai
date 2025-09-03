import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for individual developers",
    features: [
      { name: "10K credits/month", included: true },
      { name: "3 basic agents", included: true },
      { name: "1GB cloud storage", included: true },
      { name: "Community support", included: true },
      { name: "Priority queue", included: false },
      { name: "Custom agents", included: false },
    ],
    cta: "Get Started Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For professional developers",
    features: [
      { name: "1M credits/month", included: true },
      { name: "All 12 agents", included: true },
      { name: "50GB cloud storage", included: true },
      { name: "Priority support", included: true },
      { name: "Priority queue", included: true },
      { name: "Custom agents", included: true },
    ],
    cta: "Start Pro Trial",
    popular: true
  },
  {
    name: "Team",
    price: "$149",
    period: "/month",
    description: "For growing teams",
    features: [
      { name: "5M credits/month", included: true },
      { name: "All agents + custom", included: true },
      { name: "500GB cloud storage", included: true },
      { name: "Team collaboration", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Dedicated support", included: true },
    ],
    cta: "Contact Sales",
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      { name: "Unlimited credits", included: true },
      { name: "Unlimited custom agents", included: true },
      { name: "Unlimited storage", included: true },
      { name: "24/7 dedicated support", included: true },
      { name: "AWS Bedrock native", included: true },
      { name: "Custom SLA", included: true },
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Simple Pricing</h1>
          <p className="text-xl text-gray-300 mb-8">Choose the plan that fits your needs</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`
                relative bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors
                ${plan.popular ? 'border-purple-500 scale-105' : ''}
              `}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-white">
                  {plan.price}
                  {plan.period && <span className="text-lg text-gray-400">{plan.period}</span>}
                </div>
                <CardDescription className="text-gray-300">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button 
                  className={`
                    w-full 
                    ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-600'}
                  `}
                >
                  {plan.cta}
                </Button>
                
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center text-sm">
                      {feature.included ? (
                        <CheckCircle className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-500 mr-3 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-300' : 'text-gray-500'}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-slate-800/30 border-slate-600 mb-12">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">How Credits Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="text-white font-semibold mb-2">Smart Routing</h3>
                <p className="text-sm text-gray-300">
                  Automatically choose the most cost-effective AI model
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">🧠</div>
                <h3 className="text-white font-semibold mb-2">Intelligent Caching</h3>
                <p className="text-sm text-gray-300">
                  Reuse previous results to reduce costs
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">📊</div>
                <h3 className="text-white font-semibold mb-2">Real-time Usage</h3>
                <p className="text-sm text-gray-300">
                  Track credit usage with detailed breakdowns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}