import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectName, projectTopic, questions, answers } = await request.json();
    
    // Build QA pairs
    const qaSection = questions.map((q: string, i: number) => 
      `**Q${i + 1}:** ${q}\n**A${i + 1}:** ${answers[i] || 'No response provided'}`
    ).join('\n\n');
    
    const prompt = `You are a senior business analyst. Based on this detailed interview, generate a comprehensive, professional business analysis document.

PROJECT: ${projectName}
DESCRIPTION: ${projectTopic}

INTERVIEW RESULTS:
${qaSection}

Generate a well-structured document with the following sections:

# EXECUTIVE SUMMARY
Brief overview of the project and key findings (2-3 paragraphs)

# FUNCTIONAL REQUIREMENTS
List 8-10 specific functional requirements based on the interview responses. Make them detailed and actionable.

# NON-FUNCTIONAL REQUIREMENTS  
List 5-6 non-functional requirements (performance, security, usability, etc.)

# USER STORIES
Create 8-10 detailed user stories in the format:
"**As a [user type]**, I want [action] so that [benefit]"
Include acceptance criteria for key stories.

# TECHNICAL CONSIDERATIONS
List 6-8 technical requirements, architecture considerations, and constraints

# BUSINESS RULES
Define 4-6 key business rules that the system must enforce

# SUCCESS METRICS
Define 5-6 measurable success criteria for the project

# NEXT STEPS & RECOMMENDATIONS
Provide 4-5 actionable recommendations for moving forward

Make it professional, detailed, and specific to the project responses provided. Use proper formatting with headers, bullet points, and clear organization.`;

    // First, get model information
    let modelInfo = 'llama3:latest';
    try {
      const modelResponse = await fetch('http://localhost:11434/api/tags');
      if (modelResponse.ok) {
        const modelData = await modelResponse.json();
        const llama3Model = modelData.models?.find((m: any) => m.name.includes('llama3'));
        if (llama3Model) {
          // Extract size and other details
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
      return NextResponse.json({ 
        success: true, 
        output: data.response,
        source: 'ollama',
        modelInfo: modelInfo
      });
    } else {
      throw new Error('Ollama not available');
    }

  } catch (error) {
    console.log('Ollama failed, using enhanced fallback');
    
    const { projectName, questions, answers } = await request.json();
    
    const fallbackOutput = `# EXECUTIVE SUMMARY

The ${projectName} project aims to address key user needs identified through stakeholder interviews. Based on the analysis of responses, this system will provide essential functionality while maintaining high standards for usability and performance.

# FUNCTIONAL REQUIREMENTS

✅ **FR-001**: User authentication and secure access management
✅ **FR-002**: Core functionality as described: "${answers[0] || 'Primary system features'}"
✅ **FR-003**: User interface tailored for: "${answers[1] || 'Target user base'}"  
✅ **FR-004**: Key features implementation: "${answers[2] || 'Essential features'}"
✅ **FR-005**: Data management and storage capabilities
✅ **FR-006**: Search and filtering functionality
✅ **FR-007**: Reporting and analytics features
✅ **FR-008**: Mobile-responsive interface design

# NON-FUNCTIONAL REQUIREMENTS

⚡ **NFR-001**: System response time under 2 seconds for all operations
🔒 **NFR-002**: Bank-level security with data encryption  
📱 **NFR-003**: Cross-platform compatibility (web, mobile)
📈 **NFR-004**: Scalability to support 1000+ concurrent users
♿ **NFR-005**: WCAG 2.1 accessibility compliance
🔄 **NFR-006**: 99.9% system uptime and availability

# USER STORIES

${questions.map((q: string, i: number) => {
  const answer = answers[i] || 'system functionality';
  return `**Story ${i + 1}**: As a user, I want ${answer.toLowerCase()} so that I can achieve my goals efficiently`;
}).join('\n\n')}

**Additional Stories**:
- **As an administrator**, I want to manage user permissions so that I can control system access
- **As a mobile user**, I want offline functionality so that I can work without internet connection
- **As a manager**, I want detailed reports so that I can track system performance

# TECHNICAL CONSIDERATIONS

🏗️ **Architecture**: Modern 3-tier web architecture with API-first design
🔐 **Security**: OAuth 2.0, JWT tokens, encrypted data transmission
📊 **Database**: Relational database with proper indexing and optimization
🌐 **APIs**: RESTful services with comprehensive documentation  
☁️ **Deployment**: Cloud-native with auto-scaling capabilities
🔍 **Monitoring**: Real-time performance monitoring and error tracking
📱 **Frontend**: Responsive design with progressive web app features
🔧 **Integration**: API endpoints for third-party system connectivity

# BUSINESS RULES

📋 **BR-001**: User data must be validated before system entry
🔒 **BR-002**: Access permissions enforced at all system levels  
💾 **BR-003**: Automatic data backup every 24 hours
📧 **BR-004**: User notifications for critical system events
🕒 **BR-005**: Session timeouts after 30 minutes of inactivity
📊 **BR-006**: Audit trail maintained for all user actions

# SUCCESS METRICS

🎯 **User Adoption**: 80%+ of target users actively using the system within 3 months
⚡ **Performance**: Average page load time under 2 seconds
😊 **Satisfaction**: User satisfaction score of 4.0+ out of 5.0
🚀 **Efficiency**: 50%+ reduction in manual process time
📈 **Growth**: 20%+ increase in user productivity metrics
🐛 **Quality**: Less than 2 critical bugs per release

# NEXT STEPS & RECOMMENDATIONS

1. **📋 Create Detailed Wireframes**: Develop comprehensive UI/UX mockups based on requirements
2. **🏗️ Technical Architecture Design**: Define system architecture and technology stack  
3. **⏱️ Project Planning**: Create detailed project timeline with milestones
4. **👥 Team Assembly**: Identify and allocate development resources
5. **🔄 Agile Setup**: Establish sprint planning and iterative development process

---
*This analysis was generated based on stakeholder interview responses and industry best practices.*`;

    return NextResponse.json({ 
      success: true, 
      output: fallbackOutput,
      source: 'fallback',
      modelInfo: 'llama3:latest (Demo Mode)'
    });
  }
}
