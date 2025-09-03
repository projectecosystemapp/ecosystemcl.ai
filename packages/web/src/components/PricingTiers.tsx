"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";

interface Tier {
  name: string;
  price: string;
  description: string;
  features: string[];
  limitations: string[];
  cta: string;
  recommended?: boolean;
}

const tiers: Tier[] = [
  {
    name: "Standard",
    price: "Free",
    description: "For individual developers and open source projects",
    features: [
      "Unlimited BYOK (Bring Your Own Key) usage",
      "Access to Google Gemini 1.5 Pro via Google AI Studio",
      "500K monthly ECOSYSTEMCL.AI Credits",
      "Access to open-source models (Llama 3, CodeLlama)",
      "Basic orchestration with 5 concurrent plans",
      "Git integration",
      "Community support",
    ],
    limitations: [
      "Sequential step execution only",
      "No codebase embeddings",
      "No GitHub automation",
      "Standard compute resources",
    ],
    cta: "Start Free",
  },
  {
    name: "Premium",
    price: "$40",
    description: "For professional developers and small teams",
    features: [
      "Everything in Standard",
      "10M monthly ECOSYSTEMCL.AI Credits",
      "Codebase embeddings with semantic search",
      "Deep analysis agents",
      "Parallel step execution (5x faster)",
      "GitHub PR integration",
      "Human-in-the-loop approvals",
      "Automated migration agents",
      "Priority support",
      "Unlimited concurrent plans",
    ],
    limitations: [],
    cta: "Start Premium Trial",
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams that need scale, security, and support",
    features: [
      "Everything in Premium",
      "Unlimited ECOSYSTEMCL.AI Credits",
      "Self-hosted option available",
      "Custom agent development",
      "SSO/SAML authentication",
      "Dedicated compute resources",
      "SLA guarantees",
      "White-glove onboarding",
      "24/7 phone support",
      "Custom integrations",
    ],
    limitations: [],
    cta: "Contact Sales",
  },
];

export default function PricingTiers() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Choose Your Development Power
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Start free with your own API keys, or unlock advanced collaborative agents 
            with our Premium tier. Built for developers who value their time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl bg-gray-800 p-8 border-2 ${
                tier.recommended
                  ? "border-purple-500 shadow-2xl shadow-purple-500/20"
                  : "border-gray-700"
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-white">
                    {tier.price}
                  </span>
                  {tier.price !== "Free" && tier.price !== "Custom" && (
                    <span className="text-gray-400 ml-2">/month</span>
                  )}
                </div>
                <p className="text-gray-400">{tier.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
                {tier.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start">
                    <X className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-500 text-sm line-through">
                      {limitation}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href={
                  tier.name === "Enterprise"
                    ? "/contact"
                    : tier.name === "Premium"
                    ? "/sign-up?plan=premium"
                    : "/sign-up"
                }
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                  tier.recommended
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-800 rounded-xl p-8 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">
            What are ECOSYSTEMCL.AI Credits?
          </h3>
          <p className="text-gray-400 mb-6">
            ECOSYSTEMCL.AI Credits are the platform currency for AI model usage. 1 credit ≈ 1 token.
            Use them with our optimized open-source models or bring your own API keys for unlimited usage.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Standard Models</h4>
              <p className="text-sm text-gray-400">
                Llama 3 70B, CodeLlama, Mixtral - optimized for speed and cost
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">BYOK Support</h4>
              <p className="text-sm text-gray-400">
                Use your own OpenAI, Anthropic, or Google API keys with no limits
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Premium Agents</h4>
              <p className="text-sm text-gray-400">
                Advanced agents that leverage codebase embeddings and multi-step reasoning
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
