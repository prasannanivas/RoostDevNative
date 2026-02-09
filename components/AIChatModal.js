// AIChatModal.js - AI-powered mortgage pre-approval chat
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const COLORS = {
  green: '#377473',
  background: '#F6F6F6',
  black: '#1D2327',
  slate: '#707070',
  white: '#FDFDFD',
  blue: '#2271B1',
  orange: '#F0913A',
};

const API_BASE = 'http://159.203.58.60:5000'; // Update this to your server URL

const AIChatModal = ({ visible, onClose }) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [preApprovalAmount, setPreApprovalAmount] = useState(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailRequired, setEmailRequired] = useState(false);
  const [botInfo, setBotInfo] = useState({ name: 'Dave', type: 'new-buyer' });
  const [abTestVariant, setAbTestVariant] = useState(null);
  const [email, setEmail] = useState('');

  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  // Load saved session on modal open
  useEffect(() => {
    if (visible) {
      loadSavedSession();
    }
  }, [visible]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Save session to AsyncStorage whenever it updates
  useEffect(() => {
    if (sessionId && started && !isComplete) {
      saveSessionToStorage();
    }
  }, [sessionId, messages, isComplete, preApprovalAmount, showEmailPrompt, emailRequired]);

  // Fade in animation for pre-approval
  useEffect(() => {
    if (preApprovalAmount) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [preApprovalAmount]);

  // Load saved session from AsyncStorage
  const loadSavedSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem('aiChatSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        
        // Only restore if session is not complete and not too old (24 hours)
        const sessionAge = Date.now() - new Date(session.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (!session.isComplete && sessionAge < maxAge) {
          setSessionId(session.sessionId);
          setMessages(session.messages);
          setBotInfo(session.botInfo);
          setAbTestVariant(session.abTestVariant);
          setStarted(true);
          
          // Restore other state if exists
          if (session.preApprovalAmount) {
            setPreApprovalAmount(session.preApprovalAmount);
            setIsComplete(true);
          }
          if (session.showEmailPrompt) setShowEmailPrompt(session.showEmailPrompt);
          if (session.emailRequired) setEmailRequired(session.emailRequired);
          
          console.log('Restored chat session:', session.sessionId);
        } else {
          // Clear old or completed session
          await AsyncStorage.removeItem('aiChatSession');
        }
      }
    } catch (error) {
      console.error('Error loading saved session:', error);
    }
  };

  // Save current session to AsyncStorage
  const saveSessionToStorage = async () => {
    try {
      const sessionData = {
        sessionId,
        messages,
        botInfo,
        abTestVariant,
        isComplete,
        preApprovalAmount,
        showEmailPrompt,
        emailRequired,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('aiChatSession', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  // Clear saved session from AsyncStorage
  const clearSavedSession = async () => {
    try {
      await AsyncStorage.removeItem('aiChatSession');
      console.log('Cleared saved chat session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  // Initialize chat session
  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/ai-chat/session/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botType: 'new-buyer',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setBotInfo(data.botInfo);
        setAbTestVariant(data.abTestVariant);
        setMessages([
          {
            id: Date.now(),
            role: 'assistant',
            content: data.greeting,
            timestamp: new Date(),
          },
        ]);
        setStarted(true);
      } else {
        console.error('Failed to initialize chat:', data.message);
        alert('Failed to start chat. Please try again.');
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      alert('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/ai-chat/session/${sessionId}/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsTyping(false);

        // Add AI response
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Check if complete
        if (data.isComplete) {
          setIsComplete(true);

          // Handle A/B test variants
          if (data.preApprovalAmount) {
            // Variant A: Show value first
            setPreApprovalAmount(data.preApprovalAmount);
            if (data.showEmailPrompt) {
              setShowEmailPrompt(true);
            }
          } else if (data.emailRequired) {
            // Variant B: Email first, value sent via email
            setEmailRequired(true);
          }
        }
      } else {
        setIsTyping(false);
        alert('Failed to send message: ' + data.message);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Error sending message:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit email (for late collection or variant B)
  const submitEmail = async (email) => {
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/ai-chat/session/${sessionId}/email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (emailRequired && data.preApprovalAmount) {
          setPreApprovalAmount(data.preApprovalAmount);
          setEmailRequired(false);
        }

        setShowEmailPrompt(false);
        setEmail(''); // Clear email input after successful submission

        // Add confirmation message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: emailRequired
              ? `Perfect! I've sent your pre-approval details to ${email}. Check your inbox!`
              : `Great! I've sent a copy of your pre-approval to ${email}.`,
            timestamp: new Date(),
          },
        ]);
        
        // Clear saved session after email is submitted (conversation complete)
        await clearSavedSession();
      } else {
        alert('Failed to submit email: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal and abandon session
  const handleClose = async () => {
    if (sessionId && !isComplete) {
      // Mark session as abandoned
      try {
        await fetch(`${API_BASE}/api/ai-chat/session/${sessionId}/abandon`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error abandoning session:', error);
      }
    }

    // Clear saved session from storage only if complete
    if (isComplete) {
      await clearSavedSession();
    }

    // Reset state
    setSessionId(null);
    setMessages([]);
    setStarted(false);
    setIsComplete(false);
    setPreApprovalAmount(null);
    setShowEmailPrompt(false);
    setEmailRequired(false);
    setInputText('');
    setEmail('');

    onClose();
  };

  // Render start screen
  const renderStartScreen = () => (
    <View style={styles.startContainer}>
      <View style={styles.startContent}>
        <Ionicons name="chatbubbles" size={80} color={COLORS.green} />
        <Text style={styles.startTitle}>Get Pre-Approved</Text>
        <Text style={styles.startDescription}>
          Chat with our AI mortgage specialist to find out how much you can get
          approved for. It only takes a few minutes!
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={initializeChat}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.startButtonText}>Start Chat</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
        
        {/* Option to clear saved session */}
        <TouchableOpacity
          onPress={async () => {
            await clearSavedSession();
            alert('Previous conversation cleared. You can start fresh!');
          }}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.clearSessionText}>Start Fresh Conversation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render message
  const renderMessage = (message) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <Text style={isUser ? styles.userMessageText : styles.assistantMessageText}>
          {message.content}
        </Text>
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.typingDot} />
      <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
      <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
    </View>
  );

  // Render pre-approval display
  const renderPreApproval = () => (
    <Animated.View
      style={[
        styles.preApprovalContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[COLORS.green, COLORS.blue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.preApprovalGradient}
      >
        <Text style={styles.preApprovalLabel}>You're Pre-Approved For</Text>
        <Text style={styles.preApprovalAmount}>
          ${preApprovalAmount?.toLocaleString()}
        </Text>
        <Ionicons name="checkmark-circle" size={40} color={COLORS.white} />
        
        {/* Celebration animation */}
        <View style={styles.celebrationOverlay}>
          {/* <LottieView
            source={require('./assets/celebration.json')}
            autoPlay
            loop={false}
            style={styles.celebrationAnimation}
          /> */}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Render email prompt
  const renderEmailPrompt = () => {
    return (
      <View style={styles.emailPromptContainer}>
        <Text style={styles.emailPromptText}>
          {emailRequired
            ? "What's your email? I'll send your pre-approval details there."
            : 'Want a copy sent to your email?'}
        </Text>
        <View style={styles.emailInputContainer}>
          <TextInput
            style={styles.emailInput}
            placeholder="your.email@example.com"
            placeholderTextColor={COLORS.slate}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.emailSubmitButton}
            onPress={() => submitEmail(email)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
        {!emailRequired && (
          <TouchableOpacity onPress={() => setShowEmailPrompt(false)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.white} />
            <Text style={styles.headerTitle}>
              {started ? botInfo.name : 'AI Pre-Approval'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {!started ? (
          renderStartScreen()
        ) : (
          <>
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map(renderMessage)}
              {isTyping && renderTypingIndicator()}
              {preApprovalAmount && renderPreApproval()}
              {(showEmailPrompt || emailRequired) && renderEmailPrompt()}
            </ScrollView>

            {/* Input */}
            {!isComplete && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your message..."
                  placeholderTextColor={COLORS.slate}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                  multiline
                  maxHeight={100}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons name="send" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.black,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Futura',
  },
  closeButton: {
    padding: 4,
  },
  // Start screen
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  startContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  startTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 24,
    marginBottom: 16,
    fontFamily: 'Futura',
  },
  startDescription: {
    fontSize: 16,
    color: COLORS.slate,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'Futura',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    minWidth: 200,
    justifyContent: 'center',
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Futura',
  },
  clearSessionText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Futura',
    textDecorationLine: 'underline',
  },
  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.green,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: 'Futura',
  },
  assistantMessageText: {
    color: COLORS.black,
    fontSize: 15,
    fontFamily: 'Futura',
  },
  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    gap: 6,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.slate,
  },
  // Pre-approval
  preApprovalContainer: {
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  preApprovalGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  preApprovalLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Futura',
  },
  preApprovalAmount: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Futura',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  celebrationAnimation: {
    width: '100%',
    height: '100%',
  },
  // Email prompt
  emailPromptContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailPromptText: {
    fontSize: 15,
    color: COLORS.black,
    marginBottom: 12,
    fontFamily: 'Futura',
  },
  emailInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Futura',
  },
  emailSubmitButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: COLORS.slate,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'Futura',
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    fontFamily: 'Futura',
  },
  sendButton: {
    backgroundColor: COLORS.green,
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AIChatModal;
