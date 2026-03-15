(function () {
  var EXTENSION_ID = "@chaton/tps-monitor";

  // DOM elements
  var tpsValueEl = document.getElementById("tpsValue");
  var tpsDotEl = document.getElementById("tpsDot");
  var tpsWidgetEl = document.getElementById("tpsWidget");

  // State
  var currentConversationId = null;
  var isStreaming = false;
  var streamStartTime = null;
  var assistantMessageStartTime = null;
  var lastAssistantMessageId = null;
  
  // Storage for conversation TPS history
  var conversationStats = new Map(); // conversationId -> { totalTokens, totalTime, count, lastUpdated }

  // Approximate tokens from character count (rough estimate: ~4 chars per token)
  function estimateTokens(charCount) {
    return Math.max(1, Math.round(charCount / 4));
  }

  // Extract text content from a message
  function extractTextContent(message) {
    if (!message || typeof message !== "object") return "";
    
    var content = message.content;
    if (!content) return "";
    
    if (typeof content === "string") return content;
    
    if (Array.isArray(content)) {
      return content
        .filter(function (item) {
          return item && (item.type === "text" || !item.type) && item.text;
        })
        .map(function (item) {
          return item.text;
        })
        .join("");
    }
    
    return "";
  }

  // Get token count from message (from usage data or estimate from content)
  function getTokenCount(message) {
    // Try to get actual token count from usage data
    if (message.usage && typeof message.usage.output === "number") {
      return message.usage.output;
    }
    if (message.usage && typeof message.usage.totalTokens === "number") {
      return message.usage.totalTokens;
    }
    
    // Fall back to estimating from content
    var text = extractTextContent(message);
    return estimateTokens(text.length);
  }

  // Calculate TPS display value
  function calculateTPS() {
    if (!currentConversationId) return null;
    
    var stats = conversationStats.get(currentConversationId);
    if (!stats || stats.count === 0) return null;
    
    // If currently streaming, calculate real-time TPS for current response
    if (isStreaming && assistantMessageStartTime && lastAssistantMessageId) {
      var elapsed = (Date.now() - assistantMessageStartTime) / 1000;
      if (elapsed > 0.5) {
        // For ongoing streaming, we show the current rate based on
        // average of completed responses, but marked as streaming
        var avgTPS = stats.totalTokens / stats.totalTime;
        return { value: avgTPS, streaming: true };
      }
    }
    
    // Return average TPS from history
    var avgTPS = stats.totalTokens / stats.totalTime;
    return { value: avgTPS, streaming: false };
  }

  // Update the display
  function updateDisplay() {
    var tps = calculateTPS();
    
    if (!tps) {
      tpsValueEl.textContent = "-";
      tpsValueEl.className = "tps-value";
      tpsDotEl.className = "tsp-dot";
      tpsWidgetEl.title = "Tokens per second (average for this conversation)";
      return;
    }
    
    var displayValue = Math.round(tps.value);
    tpsValueEl.textContent = displayValue;
    
    // Update visual states
    tpsDotEl.className = tps.streaming ? "tsp-dot streaming" : "tsp-dot";
    
    var valueClass = "tps-value";
    if (tps.streaming) {
      valueClass += " streaming";
    } else if (tps.value >= 50) {
      valueClass += " high";
    } else if (tps.value >= 20) {
      valueClass += " medium";
    }
    tpsValueEl.className = valueClass;
    
    // Update tooltip
    if (tps.streaming) {
      tpsWidgetEl.title = "Streaming... (average: " + displayValue + " tokens/sec)";
    } else {
      var stats = conversationStats.get(currentConversationId);
      tpsWidgetEl.title = "Average: " + displayValue + " tokens/sec across " + stats.count + " response(s)";
    }
  }

  // Record a completed assistant message for TPS calculation
  function recordAssistantMessage(message, startTime, endTime) {
    var duration = (endTime - startTime) / 1000; // Convert to seconds
    if (duration < 0.1) duration = 0.1; // Minimum duration to avoid division by zero
    
    var tokens = getTokenCount(message);
    if (tokens < 1) tokens = estimateTokens(extractTextContent(message).length);
    
    var stats = conversationStats.get(currentConversationId);
    if (!stats) {
      stats = { totalTokens: 0, totalTime: 0, count: 0, lastUpdated: Date.now() };
      conversationStats.set(currentConversationId, stats);
    }
    
    stats.totalTokens += tokens;
    stats.totalTime += duration;
    stats.count += 1;
    stats.lastUpdated = Date.now();
    
    // Limit stored conversations to avoid memory bloat
    if (conversationStats.size > 100) {
      var oldestKey = conversationStats.keys().next().value;
      conversationStats.delete(oldestKey);
    }
    
    updateDisplay();
  }

  // Handle topbar context updates
  function handleTopbarContext(context) {
    if (!context || !context.conversation) return;
    
    var newConversationId = context.conversation.id;
    
    if (newConversationId !== currentConversationId) {
      currentConversationId = newConversationId;
      isStreaming = false;
      assistantMessageStartTime = null;
      lastAssistantMessageId = null;
      updateDisplay();
    }
  }

  // Subscribe to conversation events
  async function subscribeToEvents() {
    try {
      // Subscribe to agent started event
      await window.chaton.extensionEventSubscribe(EXTENSION_ID, "conversation.agent.started", {});
      
      // Subscribe to agent ended event
      await window.chaton.extensionEventSubscribe(EXTENSION_ID, "conversation.agent.ended", {});
      
      // Subscribe to message received event
      await window.chaton.extensionEventSubscribe(EXTENSION_ID, "conversation.message.received", {});
    } catch (err) {
      console.error("[TPS Monitor] Failed to subscribe to events:", err);
    }
  }

  // Listen for events from parent
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || typeof data !== "object") return;
    
    // Handle topbar context updates
    if (data.type === "chaton.extension.topbarContext") {
      handleTopbarContext(data.payload);
      return;
    }
    
    // Handle conversation events
    if (data.type === "chaton.extension.event") {
      var eventData = data.payload;
      if (!eventData || !eventData.topic) return;
      
      var topic = eventData.topic;
      var payload = eventData.payload || {};
      
      // Only process events for current conversation
      if (payload.conversationId && payload.conversationId !== currentConversationId) {
        return;
      }
      
      switch (topic) {
        case "conversation.agent.started":
          isStreaming = true;
          streamStartTime = Date.now();
          assistantMessageStartTime = Date.now();
          updateDisplay();
          break;
          
        case "conversation.agent.ended":
          isStreaming = false;
          streamStartTime = null;
          updateDisplay();
          break;
          
        case "conversation.message.received":
          var message = payload.message;
          if (!message) return;
          
          // Check if this is an assistant message
          var role = message.role || (message.message && message.message.role);
          if (role === "assistant") {
            // If we were tracking a stream, record this message
            if (assistantMessageStartTime) {
              recordAssistantMessage(message, assistantMessageStartTime, Date.now());
              assistantMessageStartTime = null;
            } else {
              // Message came in without a tracked start time
              // Estimate based on message timestamp if available
              var msgTime = message.timestamp || message.createdAt || Date.now();
              recordAssistantMessage(message, msgTime - 2000, msgTime); // Assume 2s generation
            }
            lastAssistantMessageId = message.id;
          }
          break;
      }
      
      return;
    }
    
    // Handle deeplinks
    if (data.type === "chaton.extension.deeplink") {
      // No deeplink actions for this widget
      return;
    }
  });

  // Initialize
  function init() {
    // Request initial state if available
    if (window.chaton && window.chaton.getInitialState) {
      window.chaton.getInitialState().then(function (state) {
        // State loaded, widget will receive topbarContext soon
      }).catch(function (err) {
        console.error("[TPS Monitor] Failed to get initial state:", err);
      });
    }
    
    // Subscribe to events
    subscribeToEvents();
    
    // Initial display update
    updateDisplay();
    
    console.log("[TPS Monitor] Widget initialized");
  }

  // Wait for chaton API to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
