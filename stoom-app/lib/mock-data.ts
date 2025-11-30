export interface MockSession {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: number;
  thumbnail?: string;
  hasAIInsights?: boolean;
}

export interface MockParticipant {
  id: string;
  name: string;
  avatar?: string;
  isSpeaking?: boolean;
}

export interface MockMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export interface MockTranscript {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  isActive?: boolean;
}

export const mockSessions: MockSession[] = [
  {
    id: "1",
    title: "Math Study Group - Calculus Review",
    date: "2024-01-15",
    time: "2:00 PM - 4:00 PM",
    participants: 4,
    hasAIInsights: true,
  },
  {
    id: "2",
    title: "Physics Lab Discussion",
    date: "2024-01-14",
    time: "10:00 AM - 11:30 AM",
    participants: 3,
    hasAIInsights: true,
  },
  {
    id: "3",
    title: "Chemistry Problem Solving",
    date: "2024-01-13",
    time: "3:00 PM - 5:00 PM",
    participants: 5,
    hasAIInsights: false,
  },
  {
    id: "4",
    title: "Computer Science Algorithms",
    date: "2024-01-12",
    time: "1:00 PM - 3:00 PM",
    participants: 6,
    hasAIInsights: true,
  },
];

export const mockParticipants: MockParticipant[] = [
  { id: "1", name: "Vinh", isSpeaking: true },
  { id: "2", name: "Alex", isSpeaking: false },
  { id: "3", name: "Sarah", isSpeaking: false },
  { id: "4", name: "Mike", isSpeaking: false },
  { id: "5", name: "Emma", isSpeaking: false },
];

export const mockMessages: MockMessage[] = [
  {
    id: "1",
    userId: "1",
    userName: "Alex",
    message: "Hey everyone, ready to start?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    userId: "2",
    userName: "Sarah",
    message: "Yes, let's begin with the first problem",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "3",
    userId: "3",
    userName: "Mike",
    message: "I have a question about the derivative",
    timestamp: new Date(Date.now() - 120000),
  },
];

export const mockTranscript: MockTranscript[] = [
  {
    id: "1",
    speaker: "Alex",
    text: "Welcome everyone to today's study session. Let's start by reviewing the key concepts.",
    timestamp: 0,
    isActive: false,
  },
  {
    id: "2",
    speaker: "Sarah",
    text: "I think we should focus on the integration techniques first.",
    timestamp: 15,
    isActive: false,
  },
  {
    id: "3",
    speaker: "Mike",
    text: "That's a good idea. Can someone explain the substitution method?",
    timestamp: 32,
    isActive: true,
  },
  {
    id: "4",
    speaker: "Emma",
    text: "Sure, I can walk through an example problem.",
    timestamp: 48,
    isActive: false,
  },
];

export const mockAISummary = {
  title: "AI Summary",
  keyPoints: [
    "Discussed integration techniques including substitution and integration by parts",
    "Reviewed fundamental theorem of calculus with practical examples",
    "Solved 5 practice problems collaboratively",
    "Identified common mistakes in derivative calculations",
    "Planned next session focus on advanced integration methods",
  ],
  takeaways: [
    "Substitution method is most effective for composite functions",
    "Always check your work by differentiating the result",
    "Practice problems are essential for mastering calculus concepts",
  ],
};

