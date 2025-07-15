// Gantikan bagian script dengan yang ini:

document.addEventListener('DOMContentLoaded', function() {
    // ... (kode sebelumnya tetap sama sampai bagian joinChat)

    async function joinChat() {
        const nickname = nicknameInput.value.trim();
        const instagram = instagramInput.value.trim();
        
        if (!nickname || nickname.length < 3) {
            alert('Please enter a valid nickname (min 3 characters)');
            nicknameInput.focus();
            return;
        }
        
        if (!instagram || instagram.length < 3) {
            alert('Please enter a valid Instagram username (min 3 characters)');
            instagramInput.focus();
            return;
        }
        
        if (!followCheck.checked) {
            alert('Please confirm you follow @exvisuites on Instagram to join');
            followCheck.focus();
            return;
        }
        
        joinChatBtn.disabled = true;
        joinChatBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Joining...';
        
        try {
            // Sign in anonymously with Firebase Auth
            const userCredential = await auth.signInAnonymously();
            const userId = userCredential.user.uid;
            
            currentUser = {
                id: userId,
                nickname: nickname,
                instagram: instagram,
                color: getRandomColor(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Add user to Firestore
            await db.collection('users').doc(userId).set(currentUser);
            
            // Add user to chat
            await db.collection('activeUsers').doc(userId).set(currentUser);
            
            // Show chat interface
            loginForm.classList.add('hidden');
            chatInterface.classList.remove('hidden');
            document.getElementById('onlineUsers').classList.remove('hidden');
            
            // Add welcome message
            addSystemMessage(`${currentUser.nickname} joined the chat`);
            addSystemMessage(`Welcome to LYN ChatRoom, ${currentUser.nickname}!`);
            
            // Set up real-time listeners
            setupRealTimeListeners();
            
            // Focus message input
            messageInput.focus();
        } catch (error) {
            console.error('Error joining chat:', error);
            alert('Failed to join chat. Please try again.');
        } finally {
            joinChatBtn.disabled = false;
            joinChatBtn.innerHTML = '<i class="fas fa-door-open mr-2"></i> Join Chatroom';
        }
    }
    
    function setupRealTimeListeners() {
        // Listen for new messages
        db.collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const message = change.doc.data();
                        displayMessage(message);
                    }
                });
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
        
        // Listen for online users
        db.collection('activeUsers')
            .onSnapshot(snapshot => {
                users = [];
                snapshot.forEach(doc => {
                    users.push(doc.data());
                });
                updateUserList();
            });
    }
    
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText || !currentUser) return;
        
        const message = {
            userId: currentUser.id,
            userNickname: currentUser.nickname,
            userColor: currentUser.color,
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            await db.collection('messages').add(message);
            messageInput.value = '';
            updateCharCount();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }
    
    async function leaveChat() {
        if (!currentUser) return;
        
        if (!confirm('Are you sure you want to leave the chat?')) {
            return;
        }
        
        try {
            // Remove user from active users
            await db.collection('activeUsers').doc(currentUser.id).delete();
            
            // Add leave message
            addSystemMessage(`${currentUser.nickname} left the chat`);
            
            // Sign out
            await auth.signOut();
            
            // Show login form
            chatInterface.classList.add('hidden');
            loginForm.classList.remove('hidden');
            document.getElementById('onlineUsers').classList.add('hidden');
            
            // Reset inputs
            nicknameInput.value = '';
            instagramInput.value = '';
            followCheck.checked = false;
            
            // Reset current user
            currentUser = null;
            
            // Focus nickname input
            nicknameInput.focus();
        } catch (error) {
            console.error('Error leaving chat:', error);
            alert('Failed to leave chat. Please try again.');
        }
    }
    
    // ... (fungsi-fungsi lainnya tetap sama)
});
