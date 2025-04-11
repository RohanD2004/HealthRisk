const router = require("express").Router();
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../firebase"); 
// Load API key from environment variables
require("dotenv").config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Set this in .env


async function getUserHealthData(email) {
    try {
      // Sanitize the email to match your DB key format

  
      const ref = db.ref(`users/${email}`);
      const snapshot = await ref.once("value");
  
      if (!snapshot.exists()) {
        console.log("No data found.");
        return null;
      }
  
      const healthData = snapshot.val();
      console.log("Health Data:", healthData.health_data);
      return healthData;
    } catch (err) {
      console.error("Error reading data:", err);
      return null;
    }
  }


  async function addData(mydata,email)
  {
    
    const healthRef = db.ref(`users/${email}/health_data`);

    try {
      // Get the first health record date
      const snapshot = await healthRef.once("value");
      if (!snapshot.exists()) {
        throw new Error("Health data not found to update.");
      }
    
      const data = snapshot.val();
      const firstDateKey = Object.keys(data)[0];
    
      // Update health data for that date
      const updateRef = db.ref(`users/${email}`);
    
      await updateRef.update({
        report: true,
        report_text: mydata
      });

      console.log("Report saved to Firebase.");
    } catch (error) {
      console.error("Failed to update Firebase with report:", error);
    }

  }
  
  router.get("/getRisk", async (req, res) => {
    try {
      const data = await getUserHealthData('rogan_gmail_com');
      let userData, userDataGm;
  
      if (data) {
        const dateKey = Object.keys(data.health_data)[0];
          
        const health = data.health_data[dateKey];
        userData = {
          heart_rate: health.heart_rate,
          blood_pressure_systolic: health.blood_pressure_systolic,
          blood_pressure_diastolic: health.blood_pressure_diastolic,
          sleep: health.sleep,
          stress: health.stress_level_percentage,
          temperature: health.temperature
        };
  
        // Use real values or default/mock for Gemini
        userDataGm = {
          heart_rate: userData.heart_rate,
          bp: userData.blood_pressure_systolic,
          sleep: userData.sleep,
          stress: userData.stress,
          resp: 24, // maybe from another source
          temperature: userData.temperature,
          steps: null,
          diabetes: null,
          asthma: null,
          cancer: null,
        };

        if(data.report==true)
        {
            return res.status(200).json({ data: data });
        }
       
      } else {
        return res.status(400).json({ error: "No health data found" });
      }
  
      // Step 1: Get risk level from ML server
      const riskResponse = await axios.post("http://127.0.0.1:8000/predict", userData);
  
      const riskLevel = riskResponse.data.risk_level;
      
      // Step 2: Format user data for Gemini
      const formattedData = Object.entries(userDataGm)
        .map(([key, value]) => `${key}: ${value !== null ? value : "Not Present"}`)
        .join("\n");
  
      // Step 3: Prompt Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
      Analyze this user health data and provide recommendations:
      
      USER HEALTH DATA:
      ${formattedData}
      
      RISK LEVEL: "${riskLevel}"
      
      Generate a response with these exact sections:
      
      1. RISK ASSESSMENT:
      - In simple terms, explain what "${riskLevel} risk" means for their health
      - List the 2-3 most concerning metrics from their data with ideal ranges
      - Clearly state whether they need to see a doctor (use this exact format):
        * If any critical risk factors are present: "🚨 MEDICAL WARNING: You should see a doctor immediately because [specific reason]"
        * Otherwise: "✅ No immediate doctor visit needed, but follow these recommendations"
      
      2. ACTION PLAN:
      - Provide 3-5 specific, personalized recommendations to improve their health
      - For each recommendation include:
        • The health metric it will improve
        • Exactly how to do it
        • How soon they might see results
      - Prioritize recommendations by most important first
      
      3. MONITORING ADVICE:
      - Suggest 1-2 specific health metrics to track regularly
      - Recommend how often to check them
      - Mention any warning signs that mean they should see a doctor
      
      RULES:
      - Use simple language anyone can understand
      - Be specific and actionable - no vague advice
      - For high risk cases, always recommend seeing a doctor
      - Never diagnose - only recommend doctor visits based on clear risk factors
      - Include numbers and timeframes where possible
      - Keep the entire response under 300 words`
      ;
  
      const result = await model.generateContent(prompt);
      const geminiResponse = await result.response;
      const detailedText = geminiResponse.text();
       
       await addData(detailedText,"rogan_gmail_com");
      res.status(200).json({
        risk: riskLevel,
        details: detailedText,
        data:data
      });
  
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Something went wrong", details: err.message });
    }
  });


  router.post("/store-email", (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
  
    req.session.user_email = email;
  
    console.log("Stored email in session:", req.session.user_email);
  
    res.status(200).json({ message: "Email stored successfully in session" });
  });
  
  

module.exports = router;