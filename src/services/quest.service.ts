import { QuestRepository } from "../repositories/quest.repository";

export class QuestService {
  private questRepository: QuestRepository;

  constructor() {
    this.questRepository = new QuestRepository();
  }
}
