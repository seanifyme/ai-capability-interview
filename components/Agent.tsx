"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { vapi } from "@/lib/vapi.sdk";
import { cn } from "@/lib/utils";

/* ---------- props ---------- */
export interface AgentProps {
  userName: string;
  userId: string;
  interviewId: string;
  jobTitle: string;
  department: string;
  seniority: string;
  location: string;           // still accepted for page.tsx (not used now)
}

/* ---------- local enums ---------- */
enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  PROCESSING = "PROCESSING",
}

interface SavedMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/* ================================================================ */
/*                            COMPONENT                             */
/* ================================================================ */
const Agent = ({
                 userName,
                 userId,
                 interviewId,
                 jobTitle,
                 department,
                 seniority,
                 location
               }: AgentProps) => {

  const router = useRouter();
  const processingRef = useRef(false);

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("");

  /* ---------- Vapi event binding ---------- */
  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      console.log("Call started successfully");
    };

    const onCallEnd = () => {
      console.log("Call ended. Message count:", messages.length);
      
      // Always mark as FINISHED - we'll determine complete vs incomplete during processing
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (m: Message) => {
      if (m.type === "transcript" && m.transcriptType === "final") {
        console.log(`New message received - Role: ${m.role}, Content: ${m.transcript.substring(0, 50)}...`);
        
        // Check for completion phrases from the assistant based on the exact Vapi system prompt
        if (m.role === "assistant" && 
            (m.transcript.includes("Brilliant — that's all I need") || 
             m.transcript.includes("You'll receive your AI Readiness Report shortly") ||
             m.transcript.includes("Have a great day"))) {
          // Mark that we found a completion message
          console.log("✅ Found interview completion message from Leila");
          (window as any).interviewCompleted = true;
        }
        
        setMessages(prev => [...prev, { role: m.role, content: m.transcript }]);
      }
    };

    const onError = (error: any) => {
      console.error("Vapi error:", error);
      toast.error("There was an error with the interview. Please try again.");
      setCallStatus(CallStatus.INACTIVE);
      vapi.stop();
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", () => setIsSpeaking(true));
      vapi.off("speech-end", () => setIsSpeaking(false));
      vapi.off("error", onError);
    };
  }, [messages.length]);

  /* ---------- process interview and redirect after call ---------- */
  useEffect(() => {
    if (messages.length) {
      setLastMessage(messages[messages.length - 1].content);
    }
    
    const processInterview = async () => {
      // Minimum messages check to filter extreme cases
      if (messages.length < 5) {
        console.log("Too few messages to process interview:", messages.length);
        return;
      }

      // Check if we're already processing or if conditions aren't met
      if (callStatus !== CallStatus.FINISHED || processingRef.current) {
        return;
      }
      
      // Set our processing flag to avoid duplicate calls
      processingRef.current = true;
      
      try {
        setCallStatus(CallStatus.PROCESSING);
        toast.info("Processing your interview data...");
        console.log("Starting interview processing. Messages:", messages.length);
        
        // Replace with improved interview completion check
        // Check if interview was properly completed and has enough substantive content
        const checkInterviewCompleteness = () => {
          // First, verify if we have the explicit completion message flag
          const hasCompletionFlag = (window as any).interviewCompleted === true;
          
          // If we don't have the completion flag, check for minimum requirements
          if (!hasCompletionFlag) {
            return false;
          }
          
          // Count substantive user responses (longer than 10 characters)
          const substantiveUserMessages = messages.filter(msg => 
            msg.role === 'user' && msg.content.trim().length > 10
          ).length;
          
          // Verify there are enough substantive user responses
          // This prevents incomplete interviews from being processed
          return substantiveUserMessages >= 5;
        };
        
        // Get the interview completion status
        const interviewCompleted = checkInterviewCompleteness();
        
        // Extract information from messages to create better fields
        const extractConversationInsights = () => {
          // Group consecutive messages by role for better context
          const groupedByUserTurns: { user: string[], assistant: string[] }[] = [];
          let currentTurn: { user: string[], assistant: string[] } = { user: [], assistant: [] };
          
          // Process messages to create conversation turns
          messages.forEach(msg => {
            if (msg.role === 'user') {
              if (currentTurn.assistant.length > 0) {
                // If we already have assistant messages, this is a new turn
                groupedByUserTurns.push(currentTurn);
                currentTurn = { user: [msg.content], assistant: [] };
              } else {
                // Still in the same turn
                currentTurn.user.push(msg.content);
              }
            } else {
              // Add assistant messages to current turn
              currentTurn.assistant.push(msg.content);
            }
          });
          
          // Add the last turn
          if (currentTurn.user.length > 0 || currentTurn.assistant.length > 0) {
            groupedByUserTurns.push(currentTurn);
          }
          
          // Create a structured insights object with typed data instead of just strings
          const insights: Record<string, any> = {
            responsibilities: { text: '', source: 'extraction', confidence: 0 },
            painPoints: { text: '', source: 'extraction', confidence: 0 },
            currentTools: { 
              text: '', 
              toolsList: [] as string[],
              automationLevel: null as number | null,
              source: 'extraction', 
              confidence: 0 
            },
            aiExposure: { 
              text: '', 
              level: 0, 
              toolsUsed: [] as string[],
              source: 'extraction', 
              confidence: 0 
            },
            changeAppetite: { text: '', level: 0, source: 'extraction', confidence: 0 },
            teamSize: { text: '', count: null as number | null, source: 'extraction', confidence: 0 },
            processMap: { text: '', source: 'extraction', confidence: 0 },
            metricsUsed: { text: '', metricsList: [] as string[], source: 'extraction', confidence: 0 },
            rootCauses: { text: '', source: 'extraction', confidence: 0 },
            dataFlows: { text: '', source: 'extraction', confidence: 0 },
            aiOpportunities: { text: '', source: 'extraction', confidence: 0 },
            blockers: { text: '', source: 'extraction', confidence: 0 },
            timeSpentOnRepetitiveTasks: { 
              text: '', 
              hoursPerWeek: null as number | null, 
              source: 'extraction', 
              confidence: 0 
            }
          };
          
          // Keywords and phrases related to each field
          const fieldKeywords: Record<string, string[]> = {
            responsibilities: ['responsibilities', 'day to day', 'daily', 'tasks', 'duties', 'job', 'work on', 'main role', 'accountable for', 'in charge of', 'manage', 'lead', 'coordinate'],
            painPoints: ['pain', 'challenges', 'frustrates', 'problems', 'difficult', 'bottleneck', 'slow', 'issue', 'friction', 'tedious', 'waste time', 'annoying', 'inefficient', 'manual', 'takes too long'],
            currentTools: ['tools', 'software', 'systems', 'applications', 'platform', 'technology', 'use', 'selenium', 'jenkins', 'jira', 'excel', 'database', 'crm', 'erp', 'saas', 'cloud', 'app', 'program', 'suite', 'framework'],
            aiExposure: ['ai', 'artificial intelligence', 'machine learning', 'automation', 'exposure to ai', 'chatgpt', 'ml', 'nlp', 'analytics', 'data science', 'algorithms', 'predictive', 'gpt', 'openai', 'neural networks', 'deep learning'],
            changeAppetite: ['change', 'appetite', 'willing', 'open to', 'adapt', 'improve', 'transformation', 'receptive', 'resistant', 'excited about', 'concerned about', 'hesitant', 'eager', 'ready for', 'leadership support'],
            teamSize: ['team size', 'people', 'colleagues', 'members', 'work with', 'department size', 'headcount', 'reports', 'team members', 'staff', 'organization size'],
            processMap: ['process', 'workflow', 'steps', 'procedure', 'how you', 'pipeline', 'sequence', 'lifecycle', 'methodology', 'handoff', 'flow', 'stage', 'approach', 'system'],
            metricsUsed: ['metrics', 'measure', 'kpi', 'performance', 'tracked', 'evaluated', 'success', 'goals', 'targets', 'objectives', 'benchmark', 'indicators', 'roi', 'dashboard', 'reporting', 'analytics'],
            rootCauses: ['root cause', 'reason', 'why', 'underlying', 'source', 'origin', 'fundamental', 'driver', 'core issue', 'heart of the problem', 'stems from', 'basis', 'foundational problem'],
            dataFlows: ['data', 'information', 'flows', 'privacy', 'security', 'sensitive', 'sharing', 'access', 'transfer', 'input', 'output', 'storage', 'database', 'repository', 'pipeline', 'integration'],
            aiOpportunities: ['opportunity', 'potential', 'could be', 'automate', 'improve with', 'benefit from', 'streamline', 'enhance', 'optimize', 'efficiency gain', 'time-saving', 'reduce manual', 'accelerate'],
            blockers: ['blocker', 'obstacle', 'barrier', 'preventing', 'stopping', 'challenge', 'issue', 'limitation', 'constraint', 'roadblock', 'impediment', 'showstopper', 'bottleneck', 'dependency'],
            timeSpentOnRepetitiveTasks: ['repetitive', 'manual', 'time spent', 'wasted time', 'low value', 'hours', 'minutes', 'waste', 'inefficient', 'tedious', 'mundane']
          };
          
          // Add a weight-based scoring function to improve quality of extraction
          const getResponseScore = (response: string, keywords: string[]): number => {
            let score = 0;
            // Base score on response length (longer typically means more detail)
            score += Math.min(response.length / 20, 10); // Cap at 10 points for length
            
            // Additional points for containing multiple keywords
            const keywordCount = keywords.filter(keyword => 
              response.toLowerCase().includes(keyword.toLowerCase())
            ).length;
            score += keywordCount * 2;
            
            // Bonus for responses that appear to provide specific details
            if (/\d+/.test(response)) score += 5; // Contains numbers
            if (/\b(because|since|due to)\b/i.test(response)) score += 3; // Contains reasoning
            if (response.includes(',')) score += 2; // Contains lists or clauses
            
            return score;
          };

          // Function to extract numeric values from text
          const extractNumber = (text: string): number | null => {
            const matches = text.match(/\b(\d+)\b/);
            if (matches && matches[1]) {
              return parseInt(matches[1], 10);
            }
            return null;
          };

          // Function to extract enumerated level (0-5) based on keywords
          const extractLevel = (text: string, positive: string[], negative: string[]): number => {
            const lowerText = text.toLowerCase();
            
            // Count positive and negative sentiment indicators
            const positiveCount = positive.filter(word => lowerText.includes(word)).length;
            const negativeCount = negative.filter(word => lowerText.includes(word)).length;
            
            if (positiveCount > negativeCount * 2) return 5; // Very positive
            if (positiveCount > negativeCount) return 4; // Positive
            if (positiveCount === negativeCount) return 3; // Neutral
            if (negativeCount > positiveCount) return 2; // Negative
            if (negativeCount > positiveCount * 2) return 1; // Very negative
            return 0; // Could not determine
          };

          // Function to extract tool names from text
          const extractTools = (text: string): string[] => {
            const toolPatterns = [
              /\b(jenkins|jira|confluence|slack|teams|excel|word|powerpoint|outlook|git|github|gitlab|azure|aws|gcp|selenium|cypress|cucumber|postman|swagger|notion|trello|asana|monday|clickup|figma|adobe|sketch|invision|zapier|salesforce|hubspot|zendesk|servicenow|sql|python|javascript|typescript|java|c\#|react|angular|vue)\b/gi,
            ];
            
            const tools: string[] = [];
            for (const pattern of toolPatterns) {
              const matches = text.match(pattern);
              if (matches) {
                matches.forEach(match => {
                  const tool = match.trim().toLowerCase();
                  if (!tools.includes(tool)) {
                    tools.push(tool);
                  }
                });
              }
            }
            return tools;
          };
          
          // Process each field with enhanced extraction
          Object.keys(insights).forEach(field => {
            const keywords = fieldKeywords[field];
            
            // Find turns where this topic was discussed
            const relevantTurns = groupedByUserTurns.filter(turn => {
              // Check if any assistant question contains these keywords
              const assistantMentioned = turn.assistant.some(msg => 
                keywords.some(keyword => msg.toLowerCase().includes(keyword.toLowerCase()))
              );
              
              // Check if user response contains these keywords or is a reply to a relevant question
              const userMentioned = turn.user.some(msg => 
                keywords.some(keyword => msg.toLowerCase().includes(keyword.toLowerCase()))
              );
              
              return assistantMentioned || userMentioned;
            });
            
            if (relevantTurns.length > 0) {
              // Combine all user responses from relevant turns
              const userResponses = relevantTurns.flatMap(turn => turn.user).filter(Boolean);
              
              if (userResponses.length > 0) {
                // Score responses based on relevance and detail
                const scoredResponses = userResponses.map(response => ({
                  text: response,
                  score: getResponseScore(response, keywords)
                }));
                
                // Sort by score (higher is better)
                scoredResponses.sort((a, b) => b.score - a.score);
                
                // Set confidence based on highest score
                insights[field].confidence = Math.min(scoredResponses[0].score / 20, 1); // 0-1 confidence score
                
                // For very important fields, consider combining top responses if they provide different aspects
                if (['responsibilities', 'painPoints', 'currentTools'].includes(field) && scoredResponses.length > 1) {
                  // If top responses have similar high scores but different content, combine them
                  if (scoredResponses[0].score - scoredResponses[1].score < 5 && 
                      !scoredResponses[0].text.includes(scoredResponses[1].text)) {
                    insights[field].text = `${scoredResponses[0].text} ${scoredResponses[1].text}`;
                  } else {
                    insights[field].text = scoredResponses[0].text;
                  }
                } else {
                  insights[field].text = scoredResponses[0].text;
                }
                
                // Additional field-specific processing
                if (field === 'currentTools') {
                  insights[field].toolsList = extractTools(insights[field].text);
                  
                  // Try to extract automation level
                  const automationMatch = insights[field].text.match(/(\d+)\s*%\s*automated/i) || 
                                         insights[field].text.match(/(\d+)\s*percent\s*automated/i);
                  if (automationMatch && automationMatch[1]) {
                    insights[field].automationLevel = parseInt(automationMatch[1], 10);
                  }
                } else if (field === 'aiExposure') {
                  // Extract AI tools used
                  insights[field].toolsUsed = [];
                  const aiToolPatterns = [
                    /\b(chatgpt|gpt-4|gpt-3|claude|gemini|bard|copilot|dalle|midjourney|stable diffusion|whisper|anthropic)\b/gi
                  ];
                  
                  for (const pattern of aiToolPatterns) {
                    const matches = insights[field].text.match(pattern);
                    if (matches) {
                      matches.forEach((match: string) => {
                        if (!insights[field].toolsUsed.includes(match.toLowerCase())) {
                          insights[field].toolsUsed.push(match.toLowerCase());
                        }
                      });
                    }
                  }
                  
                  // Try to determine AI exposure level (1-5)
                  insights[field].level = extractLevel(
                    insights[field].text, 
                    ['familiar', 'use', 'using', 'used', 'regularly', 'daily', 'often', 'expert', 'proficient', 'advanced'],
                    ['unfamiliar', 'never', 'rarely', 'limited', 'beginner', 'basic', 'little', 'not used']
                  );
                } else if (field === 'changeAppetite') {
                  // Determine change appetite level (1-5)
                  insights[field].level = extractLevel(
                    insights[field].text,
                    ['open', 'willing', 'excited', 'eager', 'ready', 'welcome', 'embrace', 'positive', 'interested'],
                    ['resistant', 'reluctant', 'hesitant', 'cautious', 'concerned', 'worried', 'skeptical', 'negative']
                  );
                } else if (field === 'teamSize') {
                  // Try to extract the team size number
                  insights[field].count = extractNumber(insights[field].text);
                } else if (field === 'timeSpentOnRepetitiveTasks') {
                  // Try to extract hours per week
                  const hoursMatch = insights[field].text.match(/(\d+)\s*(hours|hrs)/i);
                  if (hoursMatch && hoursMatch[1]) {
                    insights[field].hoursPerWeek = parseInt(hoursMatch[1], 10);
                  }
                } else if (field === 'metricsUsed') {
                  // Try to extract specific metrics mentioned
                  const metricPatterns = [
                    /\b(kpi|roi|revenue|conversion|retention|churn|csat|nps|efficiency|productivity|performance|quality|speed|accuracy|defects|bugs|errors|uptime|downtime|latency|throughput|cost|savings|growth)\b/gi
                  ];
                  
                  for (const pattern of metricPatterns) {
                    const matches = insights[field].text.match(pattern);
                    if (matches) {
                      matches.forEach((match: string) => {
                        if (!insights[field].metricsList.includes(match.toLowerCase())) {
                          insights[field].metricsList.push(match.toLowerCase());
                        }
                      });
                    }
                  }
                }
              }
            }
            
            // If no good answer was found, use a default
            if (!insights[field].text) {
              insights[field].text = `Not explicitly discussed during interview`;
              insights[field].source = 'default';
              insights[field].confidence = 0;
            }
          });
          
          return insights;
        };
        
        // Get actual conversation insights
        const insights = extractConversationInsights();
        
        // Create a simpler representation for API payload - extracting just the text from structured insights
        const insightsForPayload = Object.keys(insights).reduce((acc, key) => {
          acc[key] = insights[key].text;
          return acc;
        }, {} as Record<string, string>);
        
        // Additional structured data for analytics 
        const structuredData = {
          automationLevel: insights.currentTools.automationLevel,
          aiExposureLevel: insights.aiExposure.level,
          changeReadiness: insights.changeAppetite.level,
          teamSize: insights.teamSize.count,
          timeSpentOnRepetitiveTasks: insights.timeSpentOnRepetitiveTasks.hoursPerWeek,
          toolsUsed: insights.currentTools.toolsList,
          aiToolsUsed: insights.aiExposure.toolsUsed,
          metricsUsed: insights.metricsUsed.metricsList,
          extractionConfidence: Object.keys(insights).reduce((sum, key) => sum + insights[key].confidence, 0) / Object.keys(insights).length
        };
        
        // Prepare a more comprehensive payload
        const payload = {
          userId,
          employeeId: interviewId,
          role: jobTitle || "Professional",
          department,
          seniority,
          messages,
          // Mark if the interview was properly completed
          finalized: interviewCompleted, 
          // Use extracted insights for all fields
          ...insightsForPayload,
          // Add structured data metrics
          structuredData,
          extractionMethod: "enhanced-keyword-matching"
        };
        
        console.log("Sending payload to API with extracted fields:", Object.keys(payload).join(", "));
        console.log("Interview completed status:", interviewCompleted);
        
        // Send interview data to the generate endpoint
        const response = await fetch('/api/vapi/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error("API error response:", error);
          throw new Error(error.message || 'Failed to process interview');
        }
        
        // Clear the completion flag after processing
        (window as any).interviewCompleted = false;
        
        console.log("Interview processed successfully!");
        toast.success("Interview processed successfully!");
        // Redirect to dashboard after successful processing
        router.push('/');
      } catch (error) {
        console.error("Error processing interview:", error);
        toast.error("Failed to process interview. Please try again later.");
        // Still redirect to avoid getting stuck
        router.push('/');
      } finally {
        // Always reset the processing flag
        processingRef.current = false;
      }
    };
    
    processInterview();
  }, [messages, callStatus, interviewId, userId, jobTitle, department, seniority, router]);

  /* ---------- start assistant ---------- */
  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!;
    if (!assistantId) {
      console.error("Assistant ID env var missing");
      alert("Assistant ID not set. Please try later.");
      setCallStatus(CallStatus.INACTIVE);
      return;                      //  ← no throw, no warning
    }

    try {
      await vapi.start(assistantId, {
        variableValues: {
          userId,
          userName,
          user_jobTitle: jobTitle,
          user_department: department,
          user_seniority: seniority,
          user_location: location,
        },
        maxDurationSeconds: 1800 // Override default 10-minute limit with 30-minute limit
      });
    } catch (e) {
      console.error(e);
      alert("Could not start the voice interview. Please try again.");
      setCallStatus(CallStatus.INACTIVE);
    }
  };


  /* ---------- stop call ---------- */
  const handleDisconnect = () => {
    // Only set interviewCompleted if we've manually ended the call
    // before Leila has completed her script
    if (!(window as any).interviewCompleted) {
      console.log("Manual disconnection before completion. Marking as incomplete.");
    }
    
    vapi.stop();
    setCallStatus(CallStatus.FINISHED);
  };

  /* ---------- UI ---------- */
  return (
      <>
        {/* avatars */}
        <div className="call-view">
          <div className="card-interviewer">
            <div className="avatar">
              <Image
                  src="/ai-avatar.png"
                  alt="AI Interviewer"
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
              />
              {isSpeaking && <span className="animate-speak" />}
            </div>
            <h3>AI Interviewer</h3>
          </div>

          <div className="card-border">
            <div className="card-content">
              <Image
                  src="/user-avatar.png"
                  alt="User avatar"
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
              />
              <h3>{userName}</h3>
            </div>
          </div>
        </div>

        {/* live transcript */}
        {messages.length > 0 && (
            <div className="transcript-border">
              <div className="transcript">
                <p
                    key={lastMessage}
                    className={cn(
                        "transition-opacity duration-500 opacity-0",
                        "animate-fadeIn opacity-100"
                    )}
                >
                  {lastMessage}
                </p>
              </div>
            </div>
        )}

        {/* status message */}
        {callStatus === CallStatus.PROCESSING && (
          <div className="text-center mt-4 text-primary-200">
            Processing your interview data... Please wait.
          </div>
        )}

        {/* buttons */}
        <div className="w-full flex justify-center">
          {(() => {
            // This IIFE allows us to use proper conditional logic instead of ternary operators
            if (callStatus === CallStatus.PROCESSING) {
              return (
                <button 
                  className="btn-disconnect" 
                  onClick={handleDisconnect}
                  disabled={true}
                >
                  Processing...
                </button>
              );
            } else if (callStatus === CallStatus.ACTIVE) {
              return (
                <button 
                  className="btn-disconnect" 
                  onClick={handleDisconnect}
                  disabled={false}
                >
                  End
                </button>
              );
            } else {
              // INACTIVE, CONNECTING, FINISHED states
              return (
                <button 
                  className="relative btn-call" 
                  onClick={handleCall}
                  disabled={callStatus === CallStatus.CONNECTING}
                >
                  <span
                    className={cn(
                      "absolute animate-ping rounded-full opacity-75",
                      callStatus !== CallStatus.CONNECTING && "hidden"
                    )}
                  />
                  <span className="relative">
                    {callStatus === CallStatus.INACTIVE ||
                     callStatus === CallStatus.FINISHED
                      ? "Call"
                      : ". . ."}
                  </span>
                </button>
              );
            }
          })()}
        </div>
      </>
  );
};

export default Agent;
