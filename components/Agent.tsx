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
        
        // Extract information from messages to create better fields
        const extractField = (fieldName: string): string => {
          // Look for messages that might contain information about a specific field
          const relevantMessages = messages.filter(m => 
            m.content.toLowerCase().includes(fieldName.toLowerCase())
          );
          
          return relevantMessages.length > 0 
            ? relevantMessages[relevantMessages.length - 1].content 
            : `Collected during interview regarding ${fieldName}`;
        };
        
        // Check if interview was properly completed
        const interviewCompleted = (window as any).interviewCompleted === true;
        
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
          // Extract better field values from the conversation
          responsibilities: extractField("responsibilities") || "Collected during interview",
          painPoints: extractField("pain points") || extractField("challenges") || "Collected during interview",
          currentTools: extractField("tools") || extractField("software") || "Collected during interview",
          aiExposure: extractField("ai") || extractField("artificial intelligence") || "Collected during interview", 
          changeAppetite: extractField("change") || "Collected during interview",
          // Include optional fields that might help generate better feedback
          teamSize: extractField("team size") || "Unknown",
          processMap: extractField("process") || extractField("workflow") || "Not explicitly discussed",
          metricsUsed: extractField("metrics") || extractField("measure") || "Not explicitly discussed",
          rootCauses: extractField("root cause") || "Not explicitly discussed",
          dataFlows: extractField("data") || "Not explicitly discussed",
          aiOpportunities: extractField("opportunity") || "Not explicitly discussed",
          blockers: extractField("blocker") || extractField("challenge") || "Not explicitly discussed"
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
