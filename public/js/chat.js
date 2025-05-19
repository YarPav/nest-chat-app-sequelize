import {
  BASE_URL,
  formDataToJson,
  validatedAuthToken,
  relocateToMainPage,
  getMe,
} from './util.js';

const CHAT_ID_REQEXP = new RegExp('\/chat\/(\\d+)');

// let currentUser = null;
// const main = async () => {
//   // const getCurrentUser = async () => {
//   //   const res = return await fetch(`${BASE_URL}/users/me`, {
//   //     method: 'GET',
//   //     headers: {
//   //       'Content-Type': 'application/json',
//   //     },
//   //   });
//   //
//   //   currentUser = await res.json();
//   // };
//
//
//   // currentUser = await getCurrentUser();
//
//   const res = await fetch(`${BASE_URL}/users/me`, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   });
//
//   currentUser = await res.json();
// };
//
// main();

document.addEventListener('DOMContentLoaded', async () => {
  const authToken = validatedAuthToken();
  const getChatId = () => {
    const chatIdMatch = window.location.pathname.match(CHAT_ID_REQEXP);

    if (!chatIdMatch) {
      return null;
    }

    return Number(chatIdMatch[1]);
  };

  const getCurrentChat = async () => {
    const currentChat = await fetch(`${BASE_URL}/chat/${getChatId()}/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!currentChat.ok) {
      throw new Error(currentChat.statusText);
    }

    return await currentChat.json();
  };

  const chatSocket = io(`${BASE_URL}/chat`, {
    query: {
      chatId: getChatId(),
    },
    extraHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const msgCont = document.getElementById('data-container');
  const messagesEl = document.querySelector('.messages');
  const sendMessageForm = document.getElementById('send-message-form');
  const createChatForm = document.getElementById('create-chat-form');
  const newChatButton = document.getElementById('new_chat_modal_button');
  const createChatTitleInput = document.querySelector(
    '#create-chat-form #title-input',
  );
  const chatHeader = document.getElementById('chat-header');
  const participantsList = document.getElementById('participants-list');
  const potentialParticipantsEl = document.getElementById(
    'potential-participants',
  );
  const inviteUserForm = document.getElementById('invite-user-form');
  const participantActionForm = document.getElementById(
    'participant-action-form',
  );

  const currentUser = await getMe();
  const currentChat = await getCurrentChat();
  console.log(currentChat);

  //Получаем старые сообщения с сервера
  const messages = [];
  function getMessages() {
    const chatId = getChatId();
    fetch(`${BASE_URL}/message/all`, {
      method: 'POST',
      body: JSON.stringify({ chatId }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        loadDate(data);
        data.forEach((el) => {
          messages.push(el);
        });
      })
      .catch((err) => console.error(err));
  }

  if (CHAT_ID_REQEXP.test(window.location.pathname)) {
    getMessages();
  }

  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      setTimeout(() => {
        console.log('ok');
        createChatTitleInput.focus();
      }, 4);
    });
  }

  //Когда пользователь нажимает клавишу enter key, отправляем сообщение.
  if (sendMessageForm) {
    sendMessageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const messageTextInput = sendMessageForm.querySelector('#message-text');
      const chatId = getChatId();
      await sendMessage({ chatId, text: messageTextInput.value });
      messageTextInput.value = '';
    });
  }

  //Отображаем сообщения пользователям
  function loadDate(data) {
    let messages = '';
    data.map((message) => {
      const isAuthor = message.authorId === currentUser.id;
      console.log(isAuthor);

      messages += ` <li style="display: flex; flex-direction: ${isAuthor ? 'row-reverse' : 'row'}">
      <div style="width: fit-content; display: flex; flex-direction: ${isAuthor ? 'row-reverse' : 'row'}" class="${isAuthor ? 'bg-primary' : 'bg-secondary'} p-2 rounded mb-2 text-light gap-3">
        <span class="fw-bolder">${message.authorEmail}</span>
        ${message.text}
      </div>
    </li>`;
    });
    msgCont.innerHTML = messages;
  }

  //chatSocket.io
  //Создаём событие sendMessage, чтобы передать сообщение
  async function sendMessage(message) {
    await fetch(`${BASE_URL}/message/new`, {
      method: 'POST',
      body: JSON.stringify(message),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  //Слушаем событие recMessage, чтобы получать сообщения, отправленные пользователями
  chatSocket.on(`recMessageFromChat/${getChatId()}`, (recMessage) => {
    if (
      !messages.find((message) => message.messageId === recMessage.messageId)
    ) {
      messages.push(recMessage);
      loadDate(messages);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  });

  // Обрабатываем добавление нового участника чата
  chatSocket.on('recInviteUserToChat', (recMessage) => {
    const { chatId, userId, userEmail } = recMessage;

    if (!chatId) {
      throw new Error('ChatId was not provided');
    }

    const existingParticipantEl = participantsList.querySelector(
      `li[data-user-id="${userId}"]`,
    );

    if (existingParticipantEl || currentChat.isOwner) {
      return;
    }

    participantsList.insertAdjacentHTML(
      'beforeend',
      `
            <li>
              <div data-user-id="${userId}" class="bg-secondary p-2 rounded mb-2 text-light gap-3 d-flex justify-content-between align-items-center">${userEmail}</div>
            </li>
          `,
    );
  });

  // Удаляем текущего пользователя из чата
  chatSocket.on(`recRemoveMeFromChat/${getChatId()}`, () => {
    relocateToMainPage();
  });

  // Удаляем удаляемого пользователя из списка участников
  chatSocket.on(`recRemoveUserFromChat/${getChatId()}`, (chatUserRemoved) => {
    participantsList
      .querySelector(`div[data-user-id="${chatUserRemoved.userId}"]`)
      .remove();
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

  if (chatHeader) {
    chatHeader.addEventListener('click', async () => {
      const res = await fetch(
        `${BASE_URL}/chat/${getChatId()}/potential-participants`,
        {
          method: 'GET',
        },
      );

      if (!res.ok) {
        throw new Error('Error while getting users');
      }

      if (potentialParticipantsEl) {
        const users = await res.json();
        potentialParticipantsEl.innerHTML =
          '<option value="-1" selected>Select user</option>';

        for (const user of users) {
          potentialParticipantsEl.insertAdjacentHTML(
            'beforeend',
            `
            <option value="${user.id}">
              ${user.email}
            </option>
          `,
          );
        }
      }
    });
  }

  if (inviteUserForm) {
    inviteUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(inviteUserForm);
      formData.append('chatId', getChatId());
      console.log(formData.get('userId'));
      console.log(formData.getAll('userId'));
      const jsonForm = formDataToJson(formData);

      const response = await fetch(`${BASE_URL}/chat/invite`, {
        method: 'POST',
        body: jsonForm,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const invitedUser = await response.json();
        potentialParticipantsEl
          .querySelector(`option[value="${invitedUser.id}"]`)
          .remove();

        const participantEl = `
            <li>
              <div data-user-id="${invitedUser.id}"  class="bg-secondary p-2 rounded mb-2 text-light gap-3 d-flex justify-content-between align-items-center">
                ${invitedUser.email}
                <button type="submit" form="participant-action-form" data-user-id="${invitedUser.id}" data-action="remove" class="btn btn-danger">X</button>
              </div>
            </li>
          `;

        participantsList.insertAdjacentHTML('beforeend', participantEl);
      }
    });
  }

  if (participantActionForm) {
    participantActionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(participantActionForm);
      formData.append('chatId', getChatId());
      formData.append('userId', e.submitter.dataset.userId);
      const jsonForm = formDataToJson(formData);
      const action = e.submitter.dataset.action;

      const response = await fetch(`${BASE_URL}/chat/${action}`, {
        method: 'POST',
        body: jsonForm,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const res = await response.json();

        switch (action) {
          case 'remove':
            const removedUser = res;

            potentialParticipantsEl.insertAdjacentHTML(
              'beforeend',
              `
                <option value="${removedUser.id}">${removedUser.email}</option>
              `,
            );
            break;
        }
      }
    });
  }
});
