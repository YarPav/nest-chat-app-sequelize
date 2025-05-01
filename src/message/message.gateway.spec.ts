import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../chat/chat.gateway';
import { MessageService } from './message.service';

describe('MessageGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway, MessageService],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
