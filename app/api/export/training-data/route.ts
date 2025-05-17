import { db } from "@/firebase/admin";
import { convertToJSONL } from "@/lib/utils";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function GET() {
  try {
    // Check authentication (optional - remove if not needed)
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all finalized interviews
    const interviews = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .get();
    
    console.log(`Found ${interviews.docs.length} finalized interviews for export`);
    
    // Extract all training data
    const allTrainingData = interviews.docs.flatMap(doc => {
      const data = doc.data();
      return data.trainingData || [];
    });
    
    console.log(`Extracted ${allTrainingData.length} prompt-response pairs for training`);
    
    // Convert to JSONL
    const jsonlData = convertToJSONL(allTrainingData);
    
    // Return as downloadable file
    return new Response(jsonlData, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=singularshift-training-data.jsonl"
      }
    });
  } catch (error) {
    console.error("Error exporting training data:", error);
    return Response.json(
      { error: "Failed to export training data" },
      { status: 500 }
    );
  }
} 