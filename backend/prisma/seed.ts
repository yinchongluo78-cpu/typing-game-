import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const chapters = [
  {
    name: 'Chapter 1 - Greetings',
    order: 1,
    sentences: [
      { id: '1-1', content: 'Hello, how are you?', translation: '你好，你好吗？' },
      { id: '1-2', content: 'I am fine, thank you.', translation: '我很好，谢谢。' },
      { id: '1-3', content: 'Nice to meet you.', translation: '很高兴认识你。' },
      { id: '1-4', content: 'What is your name?', translation: '你叫什么名字？' },
      { id: '1-5', content: 'My name is Tom.', translation: '我叫汤姆。' },
      { id: '1-6', content: 'Good morning, everyone.', translation: '大家早上好。' },
      { id: '1-7', content: 'Good afternoon, teacher.', translation: '老师下午好。' },
      { id: '1-8', content: 'Good evening, mom and dad.', translation: '爸爸妈妈晚上好。' },
      { id: '1-9', content: 'See you tomorrow.', translation: '明天见。' },
      { id: '1-10', content: 'Have a nice day!', translation: '祝你有美好的一天！' },
    ],
  },
  {
    name: 'Chapter 2 - Family',
    order: 2,
    sentences: [
      { id: '2-1', content: 'This is my family.', translation: '这是我的家人。' },
      { id: '2-2', content: 'I have a big family.', translation: '我有一个大家庭。' },
      { id: '2-3', content: 'My father is a doctor.', translation: '我爸爸是医生。' },
      { id: '2-4', content: 'My mother is a teacher.', translation: '我妈妈是老师。' },
      { id: '2-5', content: 'I have one brother and one sister.', translation: '我有一个哥哥和一个姐姐。' },
      { id: '2-6', content: 'My grandparents live with us.', translation: '我的祖父母和我们住在一起。' },
      { id: '2-7', content: 'We love each other very much.', translation: '我们非常爱彼此。' },
      { id: '2-8', content: 'My family is very happy.', translation: '我的家庭非常幸福。' },
      { id: '2-9', content: 'We often have dinner together.', translation: '我们经常一起吃晚饭。' },
      { id: '2-10', content: 'Family is the most important thing.', translation: '家庭是最重要的。' },
    ],
  },
  {
    name: 'Chapter 3 - School',
    order: 3,
    sentences: [
      { id: '3-1', content: 'I go to school every day.', translation: '我每天去上学。' },
      { id: '3-2', content: 'My school is very big.', translation: '我的学校很大。' },
      { id: '3-3', content: 'I like my teachers.', translation: '我喜欢我的老师们。' },
      { id: '3-4', content: 'We have many subjects.', translation: '我们有很多科目。' },
      { id: '3-5', content: 'Math is my favorite subject.', translation: '数学是我最喜欢的科目。' },
      { id: '3-6', content: 'I study English every day.', translation: '我每天学习英语。' },
      { id: '3-7', content: 'We have lunch at school.', translation: '我们在学校吃午饭。' },
      { id: '3-8', content: 'I play with my friends after class.', translation: '下课后我和朋友们玩。' },
      { id: '3-9', content: 'Homework helps me learn better.', translation: '作业帮助我学得更好。' },
      { id: '3-10', content: 'I love going to school.', translation: '我喜欢上学。' },
    ],
  },
  {
    name: 'Chapter 4 - Food',
    order: 4,
    sentences: [
      { id: '4-1', content: 'I am hungry.', translation: '我饿了。' },
      { id: '4-2', content: 'What do you want to eat?', translation: '你想吃什么？' },
      { id: '4-3', content: 'I like rice and vegetables.', translation: '我喜欢米饭和蔬菜。' },
      { id: '4-4', content: 'Apples are my favorite fruit.', translation: '苹果是我最喜欢的水果。' },
      { id: '4-5', content: 'I drink milk every morning.', translation: '我每天早上喝牛奶。' },
      { id: '4-6', content: 'This food is delicious.', translation: '这食物很美味。' },
      { id: '4-7', content: 'Can I have some water, please?', translation: '请给我一些水好吗？' },
      { id: '4-8', content: 'We should eat healthy food.', translation: '我们应该吃健康的食物。' },
      { id: '4-9', content: 'I can cook simple dishes.', translation: '我会做简单的菜。' },
      { id: '4-10', content: 'Thank you for the meal.', translation: '谢谢款待。' },
    ],
  },
  {
    name: 'Chapter 5 - Weather',
    order: 5,
    sentences: [
      { id: '5-1', content: 'How is the weather today?', translation: '今天天气怎么样？' },
      { id: '5-2', content: 'It is sunny today.', translation: '今天是晴天。' },
      { id: '5-3', content: 'It is raining outside.', translation: '外面在下雨。' },
      { id: '5-4', content: 'The wind is very strong.', translation: '风很大。' },
      { id: '5-5', content: 'I like spring the best.', translation: '我最喜欢春天。' },
      { id: '5-6', content: 'Summer is very hot.', translation: '夏天很热。' },
      { id: '5-7', content: 'Autumn leaves are beautiful.', translation: '秋天的树叶很美。' },
      { id: '5-8', content: 'It snows in winter.', translation: '冬天会下雪。' },
      { id: '5-9', content: 'Remember to bring an umbrella.', translation: '记得带伞。' },
      { id: '5-10', content: 'The weather is getting warmer.', translation: '天气越来越暖和了。' },
    ],
  },
];

async function main() {
  // eslint-disable-next-line no-console
  console.log('Start seeding...');

  // 清除现有数据
  await prisma.progress.deleteMany();
  await prisma.record.deleteMany();
  await prisma.chapter.deleteMany();

  // 插入章节数据
  for (const chapter of chapters) {
    const created = await prisma.chapter.create({
      data: {
        name: chapter.name,
        order: chapter.order,
        sentences: chapter.sentences,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Created chapter: ${created.name}`);
  }

  // eslint-disable-next-line no-console
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
