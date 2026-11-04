import { chapterParagraphs } from './chapter-one.js';

const titles = ['True Stories from Nature', 'The Boa Constrictor', 'Drawing Number One', 'My Masterpiece', 'A Hat?', 'Drawing Number Two', 'Giving Up Drawing', 'Learning to Fly', 'Among Grown-ups', 'An Experiment', 'The Same Answer', 'A Sensible Man'];
const scenes = ['home', 'meet', 'dog', 'missing', 'help', 'under', 'tree', 'find', 'thanks', 'end', 'home', 'meet'];
const vocabulary = [['primeval forest', 'an ancient forest'], ['prey', 'an animal hunted for food'], ['pondered', 'thought about carefully'], ['masterpiece', 'a very fine work of art'], ['frightened', 'afraid'], ['digesting', 'breaking down food'], ['lay aside', 'stop using or doing something'], ['profession', 'a job or career'], ['matters of consequence', 'important matters'], ['clear-sighted', 'able to understand things clearly'], ['hat', 'something worn on the head'], ['sensible', 'showing practical judgment']];

export const pictureBook = {
  id: 'little-prince-chapter-1', title: 'The Little Prince · Chapter 1', englishTitle: 'Chapter 1: A Magnificent Picture',
  subtitle: 'The narrator’s first drawings and his encounters with grown-ups.', category: 'book', level: 'Original English · Guided Reading',
  englishOnly: true, emoji: '📖', color: 'sage', english: 'Grown-ups never understand anything by themselves.', chinese: '',
  goals: ['Follow the narrator’s first drawings', 'Understand the difference between a hat and a boa constrictor', 'Read and listen to the original English chapter'],
  chunks: [['at the age of six', 'when someone is six years old'], ['give up', 'stop trying or doing something'], ['at a glance', 'with one quick look'], ['close at hand', 'nearby'], ['by themselves', 'without help'], ['a great many', 'a large number of']],
  pages: chapterParagraphs.map((paragraph, index) => ({
    title: titles[index], scene: scenes[index],
    lines: (paragraph.match(/[^.!?]+(?:[.!?]+["”']?|$)/g) || [paragraph]).map((sentence) => [sentence.trim(), '']).filter(([sentence]) => sentence),
    focus: `Read paragraph ${index + 1}. Listen first, then read it aloud.`, words: [vocabulary[index]],
  })),
  patterns: [
    ['I succeeded in making my first drawing.', 'succeed in + -ing', 'Example: I succeeded in finishing the book.'],
    ['They were not able to understand it.', 'be able to + verb', 'Example: I am able to read this paragraph.'],
    ['I gave up what might have been a magnificent career as a painter.', 'give up + noun / -ing', 'Example: Do not give up learning.'],
  ],
  retellPrompts: ['What did Drawing Number One show?', 'Why did the narrator make Drawing Number Two?', 'What profession did the narrator choose?'],
  retellExample: ['The narrator drew a boa constrictor digesting an elephant.', 'The grown-ups thought it was a hat.', 'He gave up drawing and learned to pilot airplanes.'],
  quiz: [
    { question: 'What did the grown-ups think Drawing Number One showed?', options: ['A hat.', 'A forest.', 'An airplane.'], answer: 0, explanation: 'They thought the drawing was a hat.' },
    { question: 'What was actually inside the boa constrictor?', options: ['A pencil.', 'An elephant.', 'A hat.'], answer: 1, explanation: 'The drawing showed a boa constrictor digesting an elephant.' },
    { question: 'Why did the narrator make Drawing Number Two?', options: ['To draw a map.', 'To show an airplane.', 'To help the grown-ups understand.'], answer: 2, explanation: 'He drew the inside so that the grown-ups could see it clearly.' },
    { question: 'What did the narrator learn to do?', options: ['Pilot airplanes.', 'Play golf professionally.', 'Teach grammar.'], answer: 0, explanation: 'He chose another profession and learned to pilot airplanes.' },
  ],
};
