import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectName, projectTopic } = await request.json();
    
    const prompt = `You are a senior business analyst. Generate exactly 5 focused, comprehensive questions for a business analysis interview about this project:

PROJECT: ${projectName}
DESCRIPTION: ${projectTopic}

Generate 5 questions that will comprehensively gather requirements for this specific project. Make them:
- Cover different aspects: functional requirements, users, technical needs, business processes, success criteria
- Specific to this project domain and description
- Designed to elicit detailed requirements
- Progressive in depth but each independent of others
- Clear and focused

Format as a simple numbered list:
1. [Question 1 - about main purpose/goals]
2. [Question 2 - about target users/stakeholders]  
3. [Question 3 - about core features/functionality]
4. [Question 4 - about technical/integration requirements]
5. [Question 5 - about success metrics/business value]

ONLY return the numbered list, nothing else.`;

    // Get model information
    let modelInfo = 'llama3:latest';
    try {
      const modelResponse = await fetch('http://localhost:11434/api/tags');
      if (modelResponse.ok) {
        const modelData = await modelResponse.json();
        const llama3Model = modelData.models?.find((m: any) => m.name.includes('llama3'));
        if (llama3Model) {
          const sizeGB = (llama3Model.size / (1024 * 1024 * 1024)).toFixed(1);
          modelInfo = `${llama3Model.name} (${sizeGB}GB)`;
        }
      }
    } catch (error) {
      console.log('Could not fetch model info:', error);
    }

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3:latest',
        prompt: prompt,
        stream: false
      })
    });

    if (ollamaResponse.ok) {
      const data = await ollamaResponse.json();
      
      // Parse questions from response
      const questions = data.response
        .split('\n')
        .filter((line: string) => line.trim().match(/^\d+\./))
        .map((line: string) => line.trim().replace(/^\d+\.\s*/, ''))
        .slice(0, 5); // Ensure exactly 5 questions
      
      return NextResponse.json({ 
        success: true, 
        questions: questions,
        modelInfo: modelInfo
      });
    } else {
      throw new Error('Ollama not available');
    }

  } catch (error) {
    console.log('Ollama failed for questions, using fallbacks');
    
    const { projectName, projectTopic } = await request.json();
    
    // Smart fallback questions based on project type
    const isEcommerce = projectTopic.toLowerCase().includes('ecommerce') || projectTopic.toLowerCase().includes('shop') || projectTopic.toLowerCase().includes('marketplace');
    const isMobile = projectTopic.toLowerCase().includes('mobile') || projectTopic.toLowerCase().includes('app');
    const isHealthcare = projectTopic.toLowerCase().includes('health') || projectTopic.toLowerCase().includes('medical') || projectTopic.toLowerCase().includes('patient');
    const isEducation = projectTopic.toLowerCase().includes('education') || projectTopic.toLowerCase().includes('learning') || projectTopic.toLowerCase().includes('student');
    
    let fallbackQuestions = [
      `What are the primary goals and objectives of ${projectName}?`,
      'Who are the target users and what are their key characteristics and needs?',
      'What are the core features and functionalities that must be included?',
      'What technical requirements, integrations, and constraints should be considered?',
      'How will success be measured and what are the expected business outcomes?'
    ];
    
    if (isEcommerce) {
      fallbackQuestions = [
        'What products or services will be sold and what is the target market?',
        'Who are your customers and what is their shopping behavior?', 
        'What features are needed for product catalog, search, and checkout?',
        'What payment methods, shipping, and inventory systems need integration?',
        'What are the revenue goals and key performance indicators for success?'
      ];
    } else if (isMobile) {
      fallbackQuestions = [
        'What is the main problem this mobile app solves for users?',
        'Who is the target audience and what devices will they primarily use?',
        'What are the essential features for the minimum viable product?',
        'What device capabilities, APIs, and backend services are needed?',
        'What user engagement and retention metrics will define success?'
      ];
    } else if (isHealthcare) {
      fallbackQuestions = [
        'What healthcare problem or process does this system address?',
        'Who are the users (patients, doctors, staff) and their specific needs?',
        'What clinical features and workflows need to be supported?',
        'What compliance, security, and integration requirements exist?',
        'How will patient outcomes and system effectiveness be measured?'
      ];
    } else if (isEducation) {
      fallbackQuestions = [
        'What educational goals and learning outcomes should this system support?',
        'Who are the learners and educators, and what are their technical skills?',
        'What learning activities, content types, and assessment methods are needed?',
        'What technical infrastructure and third-party integrations are required?',
        'How will learning effectiveness and user engagement be measured?'
      ];
    }

    return NextResponse.json({ 
      success: true, 
      questions: fallbackQuestions,
      modelInfo: 'llama3:latest (Demo Mode)'
    });
  }
}
