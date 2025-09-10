// Twinship Wordplay Dictionary & Utilities
// Creative wordplay by replacing "in/en" sounds with "Twin"

export const TWIN_WORDPLAY: Record<string, string> = {
  // Connection & Communication
  twinvite: 'invite', // Send a Twinvite!
  twinvitation: 'invitation', // Twinvitation sent!
  twinteraction: 'interaction', // New Twinteraction!
  twinterface: 'interface', // Twinship Twinterface
  twinbox: 'inbox', // Check your Twinbox
  twinsync: 'sync', // Twinsync in progress
  twincognito: 'incognito', // Twincognito mode
  twincoming: 'incoming', // Twincoming connection!
  
  // Emotions & Experience
  twinsanity: 'insanity', // Pure Twinsanity!
  twincredible: 'incredible', // This is Twincredible!
  twintense: 'intense', // Twintense connection
  twinsational: 'sensational', // Absolutely Twinsational!
  twinspiring: 'inspiring', // So Twinspiring!
  twinstant: 'instant', // Twinstant connection
  twintimate: 'intimate', // Twintimate bond
  
  // Discovery & Knowledge
  twinterests: 'interests', // Your Twinterests
  twinformation: 'information', // Twinformation hub
  twinsight: 'insight', // Powerful Twinsight
  twintuition: 'intuition', // Trust your Twintuition
  twintellect: 'intellect', // Sharp Twintellect
  twinvestigation: 'investigation', // Deep Twinvestigation
  
  // Actions & Decisions
  twinvention: 'invention', // Creative Twinvention
  twinvestment: 'investment', // Emotional Twinvestment
  twintervention: 'intervention', // Cosmic Twintervention
  twindecision: 'decision', // Make a Twindecision
  twindeed: 'indeed', // Twindeed it is!
  twindicator: 'indicator', // Twindicator shows...
  
  // States & Qualities
  twindefensible: 'indefensible', // Twindefensible bond
  twindependent: 'independent', // Twindependent spirits
  twindeprived: 'deprived', // Never be Twindeprived
  twindividual: 'individual', // Each Twindividual
  twincidence: 'incidence', // High Twincidence rate
  
  // Places & Concepts
  twindustry: 'industry', // Twinship Twindustry
  twindex: 'index', // Connection Twindex
  twinfinite: 'infinite', // Twinfinite possibilities
  twinside: 'inside', // Look Twinside yourself
  twinland: 'inland', // Welcome to Twinland
  
  // Time & Events
  twinception: 'inception', // The Twinception moment
  twinterception: 'interception', // Twinterception of thoughts
  twinstance: 'instance', // In this Twinstance
  twinterval: 'interval', // Short Twinterval
  
  // Feelings & Reactions
  twinjoy: 'enjoy', // Twinjoy the experience
  twinchanted: 'enchanted', // Completely Twinchanted
  twinraptured: 'enraptured', // Twinraptured by connection
  twinergized: 'energized', // Feeling Twinergized
  twinlightened: 'enlightened', // Twinlightened soul
  
  // Communication & Expression
  twinquiry: 'inquiry', // Send a Twinquiry
  twinform: 'inform', // Let me Twinform you
  twintroduce: 'introduce', // Twintroduce yourself
  twingage: 'engage', // Ready to Twingage
  twincourage: 'encourage', // Twincourage each other
}

// Utility functions for dynamic Twin wordplay
export class TwinWordplay {
  // Get a Twin version of a word if it exists
  static getTwinWord(word: string): string {
    const lowerWord = word.toLowerCase()
    return TWIN_WORDPLAY[lowerWord] ? 
      this.capitalize(lowerWord) : word
  }

  // Convert a phrase to use Twin wordplay where possible
  static twinify(phrase: string): string {
    return phrase.split(' ').map(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase()
      const twinVersion = Object.keys(TWIN_WORDPLAY).find(
        twinWord => TWIN_WORDPLAY[twinWord] === cleanWord
      )
      
      if (twinVersion) {
        // Preserve original capitalization and punctuation
        const punctuation = word.replace(/\w/g, '')
        const isCapitalized = word[0] === word[0].toUpperCase()
        return (isCapitalized ? this.capitalize(twinVersion) : twinVersion) + punctuation
      }
      return word
    }).join(' ')
  }

  // Get random Twin wordplay terms
  static getRandomTwinWords(count: number = 3): string[] {
    const words = Object.keys(TWIN_WORDPLAY)
    const shuffled = [...words].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count).map(word => this.capitalize(word))
  }

  // Generate fun Twin messages
  static generateTwinMessage(type: 'connection' | 'synchronicity' | 'welcome' | 'encouragement'): string {
    switch (type) {
      case 'connection':
        return [
          "Send them a Twinvitation to join your cosmic journey!",
          "This connection looks Twincredible!",
          "Ready to Twingage with your twin flame?",
          "Your Twintuition is guiding you to something special!",
          "Time for some Twinsational bonding!"
        ][Math.floor(Math.random() * 5)]
      
      case 'synchronicity':
        return [
          "Twincredible synchronicity detected!",
          "Your twin bond is showing Twinsational alignment!",
          "This Twincidence is off the charts!",
          "Pure Twinsanity - you're totally in sync!",
          "The cosmic Twinervention is strong with this one!"
        ][Math.floor(Math.random() * 5)]
      
      case 'welcome':
        return [
          "Welcome to Twinship - where Twincredible connections begin!",
          "Get ready for a Twinsational experience!",
          "Your journey into Twinfinite possibilities starts here!",
          "Time to discover your Twinspiring connections!",
          "Welcome to the most Twincredible app you've ever experienced!"
        ][Math.floor(Math.random() * 5)]
      
      case 'encouragement':
        return [
          "Trust your Twintuition - you've got this!",
          "Stay Twinspired and keep connecting!",
          "Your Twintellect is your superpower!",
          "Keep building those Twincredible bonds!",
          "You're doing Twinderfully - keep it up!"
        ][Math.floor(Math.random() * 5)]
      
      default:
        return "Experience the Twinship magic!"
    }
  }

  // Get contextual Twin phrases for UI elements
  static getUILabel(element: string): string {
    const labels: Record<string, string> = {
      // Navigation & Pages
      'connections': 'Twin Connections Hub',
      'inbox': 'Twinbox',
      'profile': 'Your Twin Profile',
      'settings': 'Twinship Settings',
      'interests': 'Your Twinterests',
      'messages': 'Twin Messages',
      
      // Actions
      'invite': 'Send Twinvitation',
      'connect': 'Twingage Now',
      'sync': 'Twinsync Connection',
      'join': 'Join the Twinship',
      'explore': 'Explore Twinfinite Possibilities',
      
      // Status & States
      'online': 'Twinactive',
      'connected': 'Twinsynced',
      'pending': 'Twincoming Connection',
      'strong': 'Twintense Bond',
      'new': 'Fresh Twin Energy',
      
      // Emotions & Reactions
      'amazing': 'Twincredible',
      'incredible': 'Twinsational',
      'intense': 'Twintense',
      'inspiring': 'Twinspiring',
      'insightful': 'Full of Twinsight',
    }
    
    return labels[element.toLowerCase()] || element
  }

  private static capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1)
  }
}

// Pre-generated Twin phrases for common use cases
export const TWIN_PHRASES = {
  greetings: [
    "Welcome to your Twinship experience!",
    "Ready for something Twincredible?",
    "Your Twintuition brought you here!",
    "Time to explore Twinfinite connections!"
  ],
  
  connectionInvites: [
    "Send {name} a Twinvitation!",
    "Twingage with {name}!",
    "Start a Twincredible journey with {name}!",
    "Your Twintuition says {name} is special!"
  ],
  
  synchronicityAlerts: [
    "Twincredible synchronicity with your twin!",
    "Your cosmic Twinection just got stronger!",
    "Twinsational alignment detected!",
    "The Twinervention is real!"
  ],
  
  encouragement: [
    "Trust your Twintuition!",
    "You're doing Twinderfully!",
    "This is Twinsational progress!",
    "Your Twintellect is showing!"
  ]
}

// Export the main utility instance
export const twinWordplay = new TwinWordplay()
