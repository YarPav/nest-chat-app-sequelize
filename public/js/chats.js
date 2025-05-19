import { BASE_URL, formDataToJson, getMe, validatedAuthToken } from './util.js';

document.addEventListener('DOMContentLoaded', async () => {
  const authToken = validatedAuthToken();

  const chatsListEl = document.getElementById('chats_list');
  const createChatForm = document.getElementById('create-chat-form');
  const newChatButton = document.getElementById('new_chat_modal_button');
  const createChatTitleInput = document.querySelector(
    '#create-chat-form #title-input',
  );
  const currentUserEl = document.getElementById('current-user-name');

  const currentUser = await getMe();

  if (currentUser) {
    currentUserEl.textContent = currentUser.email;
  }

  const chatsSocket = io(`${BASE_URL}/chats`, {
    extraHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  chatsSocket.on('recInviteUserToChat', (recMessage) => {
    const { chatId, title } = recMessage;

    if (!chatId) {
      throw new Error('ChatId was not provided');
    }

    chatsListEl.insertAdjacentHTML(
      'beforeend',
      `<li data-chat-id="${chatId}"><a href="/chat/${chatId}">${title}</a></li>`,
    );
  });

  chatsSocket.on('recRemoveUserFromChat', (recMessage) => {
    const { chatId } = recMessage;

    if (!chatId) {
      throw new Error('ChatId was not provided');
    }

    chatsListEl.querySelector(`li[data-chat-id="${chatId}"]`).remove();
  });

  if (createChatForm) {
    createChatForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(createChatForm);
      const jsonForm = formDataToJson(formData);

      const response = await fetch(`${BASE_URL}/chat/new`, {
        method: 'POST',
        body: jsonForm,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const createdChat = await response.json();
        console.log(createdChat);
        window.location.replace(`${BASE_URL}/chat/${createdChat.id}`);
        // renderCreatedChat(createdChat);
      }
    });
  }

  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      setTimeout(() => {
        console.log('ok');
        createChatTitleInput.focus();
      }, 4);
    });
  }
});
