export type TriviaCategory =
  | 'weird-animals'
  | 'pura-vida'
  | 'around-the-world'
  | 'pop-culture'
  | 'food-and-drinks'
  | 'wait-seriously'

export type TriviaTranslation = {
  question: string
  answer: string
  comment: string
}

export type TriviaQuestion = {
  id: number
  category: TriviaCategory
  en: TriviaTranslation
  es: TriviaTranslation
}

export const triviaQuestions: TriviaQuestion[] = [
  {
    id: 1,
    category: 'wait-seriously',
    en: {
      question: "Scotland's national animal?",
      answer: 'The unicorn. 🦄',
      comment: 'Apparently, choosing an animal that actually exists was optional.',
    },
    es: {
      question: '¿Animal nacional de Escocia?',
      answer: 'El unicornio. 🦄',
      comment: 'Al parecer, elegir un animal que realmente existe era opcional.',
    },
  },
  {
    id: 2,
    category: 'wait-seriously',
    en: {
      question: 'Which planet rains diamonds?',
      answer: 'Possibly Neptune. 💎',
      comment: "The forecast is expensive, but the science isn't settled.",
    },
    es: {
      question: '¿En qué planeta podrían llover diamantes?',
      answer: 'Posiblemente Neptuno. 💎',
      comment: 'El pronóstico es carísimo, pero la ciencia aún no está convencida.',
    },
  },
  {
    id: 3,
    category: 'wait-seriously',
    en: {
      question: "What color is a polar bear's skin?",
      answer: 'Black. 🐻‍❄️',
      comment: 'The white fur is apparently just the outfit.',
    },
    es: {
      question: '¿De qué color es la piel del oso polar?',
      answer: 'Negra. 🐻‍❄️',
      comment: 'El pelaje blanco parece ser solo el atuendo.',
    },
  },
  {
    id: 4,
    category: 'wait-seriously',
    en: {
      question: 'Which animal has three hearts?',
      answer: 'The octopus. 🐙',
      comment: 'And somehow still has room for eight arms.',
    },
    es: {
      question: '¿Qué animal tiene tres corazones?',
      answer: 'El pulpo. 🐙',
      comment: 'Y todavía le queda espacio para ocho brazos.',
    },
  },
  {
    id: 5,
    category: 'wait-seriously',
    en: {
      question: 'Which planet spins sideways?',
      answer: 'Uranus. 🪐',
      comment: 'Apparently, upright was merely a suggestion.',
    },
    es: {
      question: '¿Qué planeta gira de lado?',
      answer: 'Urano. 🪐',
      comment: 'Al parecer, girar derecho era solo una sugerencia.',
    },
  },
  {
    id: 6,
    category: 'wait-seriously',
    en: {
      question: 'Can wombats make cube-shaped poop?',
      answer: 'Yes. 💩',
      comment: 'Nature invented dice and forgot the dots.',
    },
    es: {
      question: '¿Los wombats hacen popó en forma de cubo?',
      answer: 'Sí. 💩',
      comment: 'La naturaleza inventó los dados y olvidó ponerles los puntos.',
    },
  },
  {
    id: 7,
    category: 'wait-seriously',
    en: {
      question: 'What food can last for thousands of years?',
      answer: 'Honey. 🍯',
      comment: 'The ultimate pantry survivor, if stored properly.',
    },
    es: {
      question: '¿Qué alimento puede durar miles de años?',
      answer: 'La miel. 🍯',
      comment: 'La campeona de la despensa, si se conserva bien.',
    },
  },
  {
    id: 8,
    category: 'wait-seriously',
    en: {
      question: 'Which bird can fly backward?',
      answer: 'The hummingbird. 🐦',
      comment: 'Reverse gear comes standard.',
    },
    es: {
      question: '¿Qué ave puede volar hacia atrás?',
      answer: 'El colibrí. 🐦',
      comment: 'Viene con reversa de fábrica.',
    },
  },
  {
    id: 9,
    category: 'wait-seriously',
    en: {
      question: 'Which planet has a giant hexagon at its north pole?',
      answer: 'Saturn. 🪐',
      comment: 'Apparently, even the weather likes a little geometry.',
    },
    es: {
      question: '¿Qué planeta tiene un hexágono gigante en su polo norte?',
      answer: 'Saturno. 🪐',
      comment: 'Al parecer, hasta el clima tiene debilidad por la geometría.',
    },
  },
  {
    id: 10,
    category: 'wait-seriously',
    en: {
      question: 'Which mammal lays eggs?',
      answer: 'The platypus. 🥚',
      comment: 'Someone assembled this animal without reading the instructions.',
    },
    es: {
      question: '¿Qué mamífero pone huevos?',
      answer: 'El ornitorrinco. 🥚',
      comment: 'Alguien armó este animal sin leer las instrucciones.',
    },
  },
  {
    id: 11,
    category: 'wait-seriously',
    en: {
      question: 'Which planet has a day longer than its year?',
      answer: 'Venus. 🪐',
      comment: 'Monday lasts an entire season.',
    },
    es: {
      question: '¿Qué planeta tiene un día más largo que su año?',
      answer: 'Venus. 🪐',
      comment: 'Ahí un lunes dura toda una temporada.',
    },
  },
  {
    id: 12,
    category: 'wait-seriously',
    en: {
      question: 'What animal has blue blood?',
      answer: 'The horseshoe crab. 🦀',
      comment: 'Royalty has been unusually quiet about this.',
    },
    es: {
      question: '¿Qué animal tiene sangre azul?',
      answer: 'El cangrejo herradura. 🦀',
      comment: 'La realeza no ha querido comentar al respecto.',
    },
  },
  {
    id: 13,
    category: 'wait-seriously',
    en: {
      question: 'Can butterflies taste with their feet?',
      answer: 'Yes. 🦋',
      comment: 'Imagine checking the menu by standing on it.',
    },
    es: {
      question: '¿Las mariposas pueden saborear con las patas?',
      answer: 'Sí. 🦋',
      comment: 'Imaginate leer el menú parándote encima.',
    },
  },
  {
    id: 14,
    category: 'wait-seriously',
    en: {
      question: 'Which animal can sleep standing up?',
      answer: 'The horse. 🐴',
      comment: 'Some of us can barely manage sitting upright.',
    },
    es: {
      question: '¿Qué animal puede dormir de pie?',
      answer: 'El caballo. 🐴',
      comment: 'Algunos apenas logramos mantenernos sentados.',
    },
  },
  {
    id: 15,
    category: 'wait-seriously',
    en: {
      question: "What's the world's largest coral reef system?",
      answer: 'The Great Barrier Reef. 🪸',
      comment: 'Built by creatures without a single construction permit.',
    },
    es: {
      question: '¿Cuál es el sistema de arrecifes de coral más grande del mundo?',
      answer: 'La Gran Barrera de Coral. 🪸',
      comment: 'Construida por criaturas sin un solo permiso de construcción.',
    },
  },
  {
    id: 16,
    category: 'wait-seriously',
    en: {
      question: 'Can a cloud weigh over a million pounds?',
      answer: 'Yes. ☁️',
      comment: 'And somehow it still floats above your head.',
    },
    es: {
      question: '¿Puede una nube pesar más de 450 toneladas?',
      answer: 'Sí. ☁️',
      comment: 'Y aun así sigue flotando sobre tu cabeza.',
    },
  },
  {
    id: 17,
    category: 'wait-seriously',
    en: {
      question: 'Which animal has rectangular pupils?',
      answer: 'The goat. 🐐',
      comment: 'Their eyes apparently prefer widescreen.',
    },
    es: {
      question: '¿Qué animal tiene pupilas rectangulares?',
      answer: 'La cabra. 🐐',
      comment: 'Sus ojos aparentemente prefieren la pantalla panorámica.',
    },
  },
  {
    id: 18,
    category: 'wait-seriously',
    en: {
      question: 'Which fruit has its tiny fruits on the outside?',
      answer: 'The strawberry. 🍓',
      comment: 'Those little specks are doing their own thing.',
    },
    es: {
      question: '¿Qué fruta tiene sus pequeños frutos por fuera?',
      answer: 'La fresa. 🍓',
      comment: 'Esos puntitos decidieron hacer las cosas a su manera.',
    },
  },
  {
    id: 19,
    category: 'wait-seriously',
    en: {
      question: 'Which animal can regenerate parts of its brain?',
      answer: 'The axolotl. 🦎',
      comment: "Meanwhile, I can't remember why I entered the kitchen.",
    },
    es: {
      question: '¿Qué animal puede regenerar partes de su cerebro?',
      answer: 'El ajolote. 🦎',
      comment: 'Mientras tanto, yo no recuerdo para qué entré a la cocina.',
    },
  },
  {
    id: 20,
    category: 'wait-seriously',
    en: {
      question: 'Which country has a city called Batman?',
      answer: 'Turkey. 🦇',
      comment: "Gotham's tourism department has questions.",
    },
    es: {
      question: '¿En qué país hay una ciudad llamada Batman?',
      answer: 'Turquía. 🦇',
      comment: 'La oficina de turismo de Gotham tiene varias preguntas.',
    },
  },
  {
    id: 21,
    category: 'weird-animals',
    en: {
      question: 'Which animal holds hands while sleeping?',
      answer: 'Sea otters. 🦦',
      comment: 'Even their naps come with a buddy system.',
    },
    es: {
      question: '¿Qué animal se toma de las patas mientras duerme?',
      answer: 'Las nutrias marinas. 🦦',
      comment: 'Hasta para dormir tienen sistema de compañeros.',
    },
  },
  {
    id: 22,
    category: 'weird-animals',
    en: {
      question: 'Which animal has fingerprints like humans?',
      answer: 'Koalas. 🐨',
      comment: 'Somewhere, a detective is having a very confusing day.',
    },
    es: {
      question: '¿Qué animal tiene huellas digitales parecidas a las humanas?',
      answer: 'Los koalas. 🐨',
      comment: 'En algún lugar, un detective está teniendo un día muy confuso.',
    },
  },
  {
    id: 23,
    category: 'weird-animals',
    en: {
      question: 'Which animal can remain dormant for years?',
      answer: 'Some land snails. 🐌',
      comment: 'Finally, someone who understands Monday mornings.',
    },
    es: {
      question: '¿Qué animal puede permanecer inactivo durante años?',
      answer: 'Algunos caracoles terrestres. 🐌',
      comment: 'Por fin alguien que entiende los lunes por la mañana.',
    },
  },
  {
    id: 24,
    category: 'weird-animals',
    en: {
      question: 'Which bird can imitate a chainsaw?',
      answer: 'The lyrebird. 🐦',
      comment: "Nature's most unnecessarily talented sound-effects department.",
    },
    es: {
      question: '¿Qué ave puede imitar una motosierra?',
      answer: 'El ave lira. 🐦',
      comment: 'El departamento de efectos de sonido más talentoso de la naturaleza.',
    },
  },
  {
    id: 25,
    category: 'weird-animals',
    en: {
      question: 'Which animal has the largest known eyes?',
      answer: 'The colossal squid. 🦑',
      comment: 'Absolutely nothing is sneaking past that thing.',
    },
    es: {
      question: '¿Qué animal tiene los ojos más grandes conocidos?',
      answer: 'El calamar colosal. 🦑',
      comment: 'A ese bicho no se le escapa absolutamente nada.',
    },
  },
  {
    id: 26,
    category: 'weird-animals',
    en: {
      question: 'Which animal makes laughter-like sounds when tickled?',
      answer: 'Rats. 🐀',
      comment: "Their comedy clubs operate at frequencies we can't hear.",
    },
    es: {
      question: '¿Qué animal emite sonidos parecidos a risas cuando le hacen cosquillas?',
      answer: 'Las ratas. 🐀',
      comment: 'Sus clubes de comedia funcionan en frecuencias que no podemos oír.',
    },
  },
  {
    id: 27,
    category: 'weird-animals',
    en: {
      question: 'Which farm animal can recognize human faces?',
      answer: 'Sheep. 🐑',
      comment: "And you thought they weren't paying attention.",
    },
    es: {
      question: '¿Qué animal de granja reconoce rostros humanos?',
      answer: 'Las ovejas. 🐑',
      comment: 'Y vos pensando que no estaban poniendo atención.',
    },
  },
  {
    id: 28,
    category: 'weird-animals',
    en: {
      question: 'Which animal has no brain or heart?',
      answer: 'Jellyfish. 🪼',
      comment: 'Still somehow better at swimming than most of us.',
    },
    es: {
      question: '¿Qué animal no tiene cerebro ni corazón?',
      answer: 'Las medusas. 🪼',
      comment: 'Y aun así nadan mejor que la mayoría de nosotros.',
    },
  },
  {
    id: 29,
    category: 'weird-animals',
    en: {
      question: 'Which fish can change from male to female?',
      answer: 'Clownfish. 🐠',
      comment: 'Their family tree comes with plot twists.',
    },
    es: {
      question: '¿Qué pez puede cambiar de macho a hembra?',
      answer: 'El pez payaso. 🐠',
      comment: 'Su árbol genealógico viene con giros inesperados.',
    },
  },
  {
    id: 30,
    category: 'weird-animals',
    en: {
      question: 'Which insect has five eyes?',
      answer: 'The honeybee. 🐝',
      comment: 'And still occasionally flies into windows.',
    },
    es: {
      question: '¿Qué insecto tiene cinco ojos?',
      answer: 'La abeja melífera. 🐝',
      comment: 'Y aun así de vez en cuando choca contra una ventana.',
    },
  },
  {
    id: 31,
    category: 'weird-animals',
    en: {
      question: 'Which frog can survive partially freezing?',
      answer: 'The wood frog. 🐸',
      comment: 'They take winter breaks extremely seriously.',
    },
    es: {
      question: '¿Qué rana puede sobrevivir parcialmente congelada?',
      answer: 'La rana de bosque. 🐸',
      comment: 'Se toma las vacaciones de invierno demasiado en serio.',
    },
  },
  {
    id: 32,
    category: 'weird-animals',
    en: {
      question: 'Which animal has a tongue longer than its body?',
      answer: 'Some chameleons. 🦎',
      comment: 'Dinner comes with express delivery.',
    },
    es: {
      question: '¿Qué animal puede tener una lengua más larga que su cuerpo?',
      answer: 'Algunos camaleones. 🦎',
      comment: 'La cena viene con entrega exprés.',
    },
  },
  {
    id: 33,
    category: 'weird-animals',
    en: {
      question: 'Which land mammal has the longest pregnancy?',
      answer: 'The elephant. 🐘',
      comment: "Nine months? That's adorable.",
    },
    es: {
      question: '¿Qué mamífero terrestre tiene el embarazo más largo?',
      answer: 'El elefante. 🐘',
      comment: '¿Nueve meses? Qué ternura.',
    },
  },
  {
    id: 34,
    category: 'weird-animals',
    en: {
      question: 'Which bird can sleep while flying?',
      answer: 'The frigatebird. 🐦',
      comment: 'The original in-flight nap service.',
    },
    es: {
      question: '¿Qué ave puede dormir mientras vuela?',
      answer: 'La fragata. 🐦',
      comment: 'El servicio original de siestas a bordo.',
    },
  },
  {
    id: 35,
    category: 'weird-animals',
    en: {
      question: 'Which animal has thousands of tiny teeth on its tongue?',
      answer: 'Many snails. 🐌',
      comment: 'Suddenly, French kissing sounds complicated.',
    },
    es: {
      question: '¿Qué animal tiene miles de dientecitos en la lengua?',
      answer: 'Muchos caracoles. 🐌',
      comment: 'De repente, los besos franceses suenan complicados.',
    },
  },
  {
    id: 36,
    category: 'weird-animals',
    en: {
      question: 'Which fish has a transparent head?',
      answer: 'The barreleye fish. 🐟',
      comment: 'Privacy settings: permanently disabled.',
    },
    es: {
      question: '¿Qué pez tiene la cabeza transparente?',
      answer: 'El pez de ojos de barril. 🐟',
      comment: 'Configuración de privacidad: desactivada para siempre.',
    },
  },
  {
    id: 37,
    category: 'weird-animals',
    en: {
      question: 'Which animal can taste with its arms?',
      answer: 'The octopus. 🐙',
      comment: 'Every handshake is a restaurant review.',
    },
    es: {
      question: '¿Qué animal puede saborear con los brazos?',
      answer: 'El pulpo. 🐙',
      comment: 'Cada apretón de manos es una reseña gastronómica.',
    },
  },
  {
    id: 38,
    category: 'weird-animals',
    en: {
      question: 'Which lizard can run across water?',
      answer: 'The basilisk lizard. 🦎',
      comment: 'Physics has filed a formal complaint.',
    },
    es: {
      question: '¿Qué lagarto puede correr sobre el agua?',
      answer: 'El basilisco. 🦎',
      comment: 'La física presentó una queja formal.',
    },
  },
  {
    id: 39,
    category: 'weird-animals',
    en: {
      question: 'Which worm can regrow a body from a fragment?',
      answer: 'Some planarian flatworms. 🪱',
      comment: 'Lose a piece? Just grow another you.',
    },
    es: {
      question: '¿Qué gusano puede regenerar un cuerpo a partir de un fragmento?',
      answer: 'Algunas planarias. 🪱',
      comment: '¿Perdiste un pedazo? Fabricate otro vos.',
    },
  },
  {
    id: 40,
    category: 'weird-animals',
    en: {
      question: 'Which bird can remember human faces for years?',
      answer: 'The crow. 🐦‍⬛',
      comment: 'Be nice. They keep receipts.',
    },
    es: {
      question: '¿Qué ave puede recordar rostros humanos durante años?',
      answer: 'El cuervo. 🐦‍⬛',
      comment: 'Portate bien. Ellos guardan las pruebas.',
    },
  },
  {
    id: 41,
    category: 'pura-vida',
    en: {
      question: "Costa Rica's national bird?",
      answer: 'Clay-colored thrush. 🐦',
      comment: 'With all those colorful birds, we chose the brown one.',
    },
    es: {
      question: '¿Ave nacional de Costa Rica?',
      answer: 'El yigüirro. 🐦',
      comment: 'Con tantas aves coloridas, escogimos la café.',
    },
  },
  {
    id: 42,
    category: 'pura-vida',
    en: {
      question: 'What does "pura vida" literally mean?',
      answer: 'Pure life. 🌴',
      comment: 'Two words. Approximately 400 different uses.',
    },
    es: {
      question: '¿Qué significa literalmente "pura vida"?',
      answer: 'Vida pura. 🌴',
      comment: 'Dos palabras. Aproximadamente 400 usos diferentes.',
    },
  },
  {
    id: 43,
    category: 'pura-vida',
    en: {
      question: 'Which Costa Rican volcano has a crater lake?',
      answer: 'Poás. 🌋',
      comment: 'Even volcanoes need swimming pools.',
    },
    es: {
      question: '¿Qué volcán de Costa Rica tiene una laguna en su cráter?',
      answer: 'El Poás. 🌋',
      comment: 'Hasta los volcanes necesitan piscina.',
    },
  },
  {
    id: 44,
    category: 'pura-vida',
    en: {
      question: "Costa Rica's national flower?",
      answer: 'Guaria morada. 🌸',
      comment: 'Purple, elegant, and considerably quieter than a howler monkey.',
    },
    es: {
      question: '¿Flor nacional de Costa Rica?',
      answer: 'La guaria morada. 🌸',
      comment: 'Morada, elegante y mucho más silenciosa que un mono congo.',
    },
  },
  {
    id: 45,
    category: 'pura-vida',
    en: {
      question: "What animal appears on Costa Rica's ₡10,000 bill?",
      answer: 'A sloth. 🦥',
      comment: 'Even our money refuses to hurry.',
    },
    es: {
      question: '¿Qué animal aparece en el billete de ₡10.000?',
      answer: 'Un perezoso. 🦥',
      comment: 'Hasta nuestra plata se niega a andar con prisa.',
    },
  },
  {
    id: 46,
    category: 'pura-vida',
    en: {
      question: "Costa Rica's famous painted oxcarts?",
      answer: 'Carretas. 🎨',
      comment: 'Before custom rims, we had custom wheels.',
    },
    es: {
      question: '¿Cómo se llaman las famosas carretas pintadas de Costa Rica?',
      answer: 'Carretas típicas. 🎨',
      comment: 'Antes de los aros personalizados, teníamos ruedas decoradas.',
    },
  },
  {
    id: 47,
    category: 'pura-vida',
    en: {
      question: 'What do Ticos call a traffic jam?',
      answer: 'Una presa. 🚗',
      comment: "The national test of everyone's pura vida.",
    },
    es: {
      question: '¿Cómo le dicen los ticos a un embotellamiento?',
      answer: 'Una presa. 🚗',
      comment: 'La prueba nacional de paciencia y pura vida.',
    },
  },
  {
    id: 48,
    category: 'pura-vida',
    en: {
      question: 'Which Costa Rican town is famous for painted oxcarts?',
      answer: 'Sarchí. 🎨',
      comment: 'Where even the wheels dress up for special occasions.',
    },
    es: {
      question: '¿Qué pueblo es famoso por sus carretas pintadas?',
      answer: 'Sarchí. 🎨',
      comment: 'Donde hasta las ruedas se arreglan para salir.',
    },
  },
  {
    id: 49,
    category: 'pura-vida',
    en: {
      question: "Costa Rica's national tree?",
      answer: 'The Guanacaste tree. 🌳',
      comment: 'A tree so important we gave a province the same name.',
    },
    es: {
      question: '¿Árbol nacional de Costa Rica?',
      answer: 'El guanacaste. 🌳',
      comment: 'Un árbol tan importante que hasta una provincia lleva su nombre.',
    },
  },
  {
    id: 50,
    category: 'pura-vida',
    en: {
      question: 'What does "mae" mean in Costa Rica?',
      answer: 'Dude / buddy. 🤙',
      comment: 'One word, approximately a million conversations.',
    },
    es: {
      question: '¿Qué significa "mae" en Costa Rica?',
      answer: 'Amigo / compa. 🤙',
      comment: 'Una palabra, aproximadamente un millón de conversaciones.',
    },
  },
  {
    id: 51,
    category: 'pura-vida',
    en: {
      question: "Costa Rica's national wildlife symbol?",
      answer: 'The white-tailed deer. 🦌',
      comment: 'The sloth is demanding a recount.',
    },
    es: {
      question: '¿Símbolo nacional de fauna silvestre de Costa Rica?',
      answer: 'El venado cola blanca. 🦌',
      comment: 'El perezoso está exigiendo un recuento de votos.',
    },
  },
  {
    id: 52,
    category: 'pura-vida',
    en: {
      question: 'Which Costa Rican volcano has a nearly perfect cone?',
      answer: 'Arenal. 🌋',
      comment: 'Nature apparently owns a geometry set.',
    },
    es: {
      question: '¿Qué volcán de Costa Rica tiene forma de cono casi perfecto?',
      answer: 'El Arenal. 🌋',
      comment: 'Al parecer, la naturaleza tiene un juego de geometría.',
    },
  },
  {
    id: 53,
    category: 'pura-vida',
    en: {
      question: 'What is a "casado" in Costa Rica?',
      answer: 'A traditional meal. 🍛',
      comment: 'No marriage certificate required.',
    },
    es: {
      question: '¿Qué es un "casado" en Costa Rica?',
      answer: 'Un plato típico. 🍛',
      comment: 'No se necesita certificado de matrimonio.',
    },
  },
  {
    id: 54,
    category: 'pura-vida',
    en: {
      question: 'What do Ticos call popcorn?',
      answer: 'Palomitas or rosetas. 🍿',
      comment: 'The movie starts after the vocabulary debate.',
    },
    es: {
      question: '¿Cómo se llaman las palomitas de maíz en Costa Rica?',
      answer: 'Palomitas o rosetas. 🍿',
      comment: 'La película empieza después del debate de vocabulario.',
    },
  },
  {
    id: 55,
    category: 'pura-vida',
    en: {
      question: "Costa Rica's national symbol of labor?",
      answer: 'The oxcart. 🐂',
      comment: 'Before delivery apps, we had two oxen and a plan.',
    },
    es: {
      question: '¿Símbolo nacional del trabajo en Costa Rica?',
      answer: 'La carreta típica. 🐂',
      comment: 'Antes de las aplicaciones de entrega, teníamos dos bueyes y un plan.',
    },
  },
  {
    id: 56,
    category: 'pura-vida',
    en: {
      question: 'What does "tuanis" mean?',
      answer: 'Cool / great. 😎',
      comment: "And yes, that's where our name comes from.",
    },
    es: {
      question: '¿Qué significa "tuanis"?',
      answer: 'Chiva / genial. 😎',
      comment: 'Y sí, de ahí viene nuestro nombre.',
    },
  },
  {
    id: 57,
    category: 'pura-vida',
    en: {
      question: "Costa Rica's traditional breakfast?",
      answer: 'Gallo pinto. 🍚',
      comment: 'Rice and beans got married and became famous.',
    },
    es: {
      question: '¿Desayuno tradicional de Costa Rica?',
      answer: 'Gallo pinto. 🍚',
      comment: 'El arroz y los frijoles se casaron y se hicieron famosos.',
    },
  },
  {
    id: 58,
    category: 'pura-vida',
    en: {
      question: 'Which Costa Rican provinces border Nicaragua?',
      answer: 'Guanacaste and Alajuela. 🗺️',
      comment: 'Two provinces sharing one very long neighbor.',
    },
    es: {
      question: '¿Qué provincias de Costa Rica limitan con Nicaragua?',
      answer: 'Guanacaste y Alajuela. 🗺️',
      comment: 'Dos provincias compartiendo un vecino bastante largo.',
    },
  },
  {
    id: 59,
    category: 'pura-vida',
    en: {
      question: 'What does "diay" mean?',
      answer: 'Depends on the situation. 🤷',
      comment: 'A question, a greeting, and an entire conversation.',
    },
    es: {
      question: '¿Qué significa "diay"?',
      answer: 'Depende del contexto. 🤷',
      comment: 'Una pregunta, un saludo y una conversación completa.',
    },
  },
  {
    id: 60,
    category: 'pura-vida',
    en: {
      question: 'What do Ticos call a small appetizer?',
      answer: 'Una boca. 🍽️',
      comment: 'Because apparently even your mouth needs an appetizer.',
    },
    es: {
      question: '¿Cómo le dicen los ticos a un aperitivo pequeño?',
      answer: 'Una boca. 🍽️',
      comment: 'Porque aparentemente hasta la boca necesita un aperitivo.',
    },
  },
  {
    id: 61,
    category: 'around-the-world',
    en: {
      question: 'Which country has the most time zones?',
      answer: 'France. 🇫🇷',
      comment: 'Apparently, being fashionably late requires 12 different clocks.',
    },
    es: {
      question: '¿Qué país tiene más zonas horarias?',
      answer: 'Francia. 🇫🇷',
      comment: 'Al parecer, llegar elegantemente tarde requiere 12 relojes diferentes.',
    },
  },
  {
    id: 62,
    category: 'around-the-world',
    en: {
      question: 'Which country has more pyramids than Egypt?',
      answer: 'Sudan. 🇸🇩',
      comment: "Egypt's marketing department deserves a raise.",
    },
    es: {
      question: '¿Qué país tiene más pirámides que Egipto?',
      answer: 'Sudán. 🇸🇩',
      comment: 'El departamento de mercadeo de Egipto merece un aumento.',
    },
  },
  {
    id: 63,
    category: 'around-the-world',
    en: {
      question: 'Which country has a town named Boring?',
      answer: 'The United States. 🇺🇸',
      comment: 'Oregon really knows how to attract tourists.',
    },
    es: {
      question: '¿Qué país tiene un pueblo llamado Boring?',
      answer: 'Estados Unidos. 🇺🇸',
      comment: 'Oregón sí que sabe cómo atraer turistas.',
    },
  },
  {
    id: 64,
    category: 'around-the-world',
    en: {
      question: 'Which country has no permanent rivers?',
      answer: 'Saudi Arabia. 🇸🇦',
      comment: 'The river cruise industry has some challenges.',
    },
    es: {
      question: '¿Qué país no tiene ríos permanentes?',
      answer: 'Arabia Saudita. 🇸🇦',
      comment: 'La industria de cruceros fluviales enfrenta ciertos desafíos.',
    },
  },
  {
    id: 65,
    category: 'around-the-world',
    en: {
      question: 'Which country has a village called Dull?',
      answer: 'Scotland. 🏴',
      comment: "And it's actually paired with Boring, Oregon.",
    },
    es: {
      question: '¿Qué país tiene una aldea llamada Dull?',
      answer: 'Escocia. 🏴',
      comment: 'Y está hermanada con Boring, Oregón. No es broma.',
    },
  },
  {
    id: 66,
    category: 'around-the-world',
    en: {
      question: "Where's the world's largest salt flat?",
      answer: 'Bolivia. 🇧🇴',
      comment: "The world's biggest mirror doesn't need polishing.",
    },
    es: {
      question: '¿Dónde está el salar más grande del mundo?',
      answer: 'Bolivia. 🇧🇴',
      comment: 'El espejo más grande del mundo no necesita pulirse.',
    },
  },
  {
    id: 67,
    category: 'around-the-world',
    en: {
      question: 'Which country has more lakes than any other?',
      answer: 'Canada. 🇨🇦',
      comment: "At some point, you'd think they'd run out of land.",
    },
    es: {
      question: '¿Qué país tiene más lagos que cualquier otro?',
      answer: 'Canadá. 🇨🇦',
      comment: 'Uno pensaría que en algún momento se les acabaría la tierra.',
    },
  },
  {
    id: 68,
    category: 'around-the-world',
    en: {
      question: 'Which country has a village called Hell?',
      answer: 'Norway. 🇳🇴',
      comment: 'Yes, Hell freezes over. Every winter.',
    },
    es: {
      question: '¿Qué país tiene un pueblo llamado Hell?',
      answer: 'Noruega. 🇳🇴',
      comment: 'Sí, el infierno se congela. Todos los inviernos.',
    },
  },
  {
    id: 69,
    category: 'around-the-world',
    en: {
      question: "Where's the world's deepest lake?",
      answer: 'Russia. 🇷🇺',
      comment: 'Lake Baikal is not interested in shallow conversations.',
    },
    es: {
      question: '¿Dónde está el lago más profundo del mundo?',
      answer: 'Rusia. 🇷🇺',
      comment: 'El lago Baikal no tiene interés en conversaciones superficiales.',
    },
  },
  {
    id: 70,
    category: 'around-the-world',
    en: {
      question: 'Which country has a pink lake called Lake Hillier?',
      answer: 'Australia. 🇦🇺',
      comment: 'Nature apparently spilled a giant strawberry milkshake.',
    },
    es: {
      question: '¿Qué país tiene un lago rosado llamado Hillier?',
      answer: 'Australia. 🇦🇺',
      comment: 'Parece que la naturaleza derramó un batido gigante de fresa.',
    },
  },
  {
    id: 71,
    category: 'around-the-world',
    en: {
      question: 'Which country does Greenland belong to?',
      answer: 'Denmark. 🇬🇱',
      comment: 'The island is enormous. The name is optimistic.',
    },
    es: {
      question: '¿A qué país pertenece Groenlandia?',
      answer: 'Dinamarca. 🇬🇱',
      comment: 'La isla es enorme. El nombre es bastante optimista.',
    },
  },
  {
    id: 72,
    category: 'around-the-world',
    en: {
      question: 'Which country has the most islands?',
      answer: 'Sweden. 🇸🇪',
      comment: "Apparently, one mainland wasn't enough.",
    },
    es: {
      question: '¿Qué país tiene más islas?',
      answer: 'Suecia. 🇸🇪',
      comment: 'Al parecer, un solo territorio continental no era suficiente.',
    },
  },
  {
    id: 73,
    category: 'around-the-world',
    en: {
      question: "Where's the world's highest uninterrupted waterfall?",
      answer: 'Venezuela. 🇻🇪',
      comment: 'Angel Falls takes falling water very seriously.',
    },
    es: {
      question: '¿Dónde está la catarata ininterrumpida más alta del mundo?',
      answer: 'Venezuela. 🇻🇪',
      comment: 'El Salto Ángel se toma muy en serio eso de dejar caer agua.',
    },
  },
  {
    id: 74,
    category: 'around-the-world',
    en: {
      question: 'Which country has a town called Sandwich?',
      answer: 'England. 🥪',
      comment: 'Finally, a place that sounds delicious.',
    },
    es: {
      question: '¿Qué país tiene un pueblo llamado Sandwich?',
      answer: 'Inglaterra. 🥪',
      comment: 'Por fin, un lugar que suena delicioso.',
    },
  },
  {
    id: 75,
    category: 'around-the-world',
    en: {
      question: "What's the world's largest desert?",
      answer: 'Antarctica. 🧊',
      comment: 'Nobody said deserts had to be hot.',
    },
    es: {
      question: '¿Cuál es el desierto más grande del mundo?',
      answer: 'La Antártida. 🧊',
      comment: 'Nadie dijo que los desiertos tenían que ser calientes.',
    },
  },
  {
    id: 76,
    category: 'around-the-world',
    en: {
      question: 'Which country has a city named Truth or Consequences?',
      answer: 'The United States. 🇺🇸',
      comment: 'Sounds less like a town and more like a game show.',
    },
    es: {
      question: '¿Qué país tiene una ciudad llamada Truth or Consequences?',
      answer: 'Estados Unidos. 🇺🇸',
      comment: 'Suena menos a ciudad y más a programa de concursos.',
    },
  },
  {
    id: 77,
    category: 'around-the-world',
    en: {
      question: 'Which country has the enormous Sơn Đoòng cave?',
      answer: 'Vietnam. 🇻🇳',
      comment: 'Makes your living room look a little cramped.',
    },
    es: {
      question: '¿En qué país está la enorme cueva Sơn Đoòng?',
      answer: 'Vietnam. 🇻🇳',
      comment: 'Hace que tu sala parezca un poquito estrecha.',
    },
  },
  {
    id: 78,
    category: 'around-the-world',
    en: {
      question: 'Which country has a town named Accident?',
      answer: 'The United States. 🇺🇸',
      comment: 'Maryland insists it was completely intentional.',
    },
    es: {
      question: '¿Qué país tiene un pueblo llamado Accident?',
      answer: 'Estados Unidos. 🇺🇸',
      comment: 'Maryland insiste en que fue completamente intencional.',
    },
  },
  {
    id: 79,
    category: 'around-the-world',
    en: {
      question: 'Which country has the giant Kiritimati coral atoll?',
      answer: 'Kiribati. 🇰🇮',
      comment: 'Apparently, a regular-sized island just would not do.',
    },
    es: {
      question: '¿En qué país está el enorme atolón de Kiritimati?',
      answer: 'Kiribati. 🇰🇮',
      comment: 'Al parecer, una isla de tamaño normal no era suficiente.',
    },
  },
  {
    id: 80,
    category: 'around-the-world',
    en: {
      question: 'Which country has a town named Okay?',
      answer: 'The United States. 🇺🇸',
      comment: "Oklahoma's most modest tourism campaign.",
    },
    es: {
      question: '¿Qué país tiene un pueblo llamado Okay?',
      answer: 'Estados Unidos. 🇺🇸',
      comment: 'La campaña turística más modesta de Oklahoma.',
    },
  },
  {
    id: 81,
    category: 'pop-culture',
    en: {
      question: "Mickey Mouse's original name?",
      answer: 'Mortimer Mouse. 🐭',
      comment: 'Mickey really dodged a branding disaster.',
    },
    es: {
      question: '¿Nombre original de Mickey Mouse?',
      answer: 'Mortimer Mouse. 🐭',
      comment: 'Mickey se salvó de un desastre de mercadeo.',
    },
  },
  {
    id: 82,
    category: 'pop-culture',
    en: {
      question: "Dorothy's slippers in the original Oz book?",
      answer: 'Silver. 👠',
      comment: 'Hollywood changed them to ruby red. Even shoes get a makeover.',
    },
    es: {
      question: '¿De qué color eran los zapatos de Dorothy en el libro de Oz?',
      answer: 'Plateados. 👠',
      comment: 'Hollywood los cambió a rojo rubí. Hasta los zapatos reciben un cambio de imagen.',
    },
  },
  {
    id: 83,
    category: 'pop-culture',
    en: {
      question: 'Who is the King of Pop?',
      answer: 'Michael Jackson. 👑',
      comment: 'One glove. One moonwalk. An entire planet watching.',
    },
    es: {
      question: '¿Quién es el Rey del Pop?',
      answer: 'Michael Jackson. 👑',
      comment: 'Un guante. Un moonwalk. Todo un planeta mirando.',
    },
  },
  {
    id: 84,
    category: 'pop-culture',
    en: {
      question: 'Why are the Simpsons yellow?',
      answer: 'To stand out on TV. 💛',
      comment: 'Thirty-plus years, and nobody has suggested sunscreen.',
    },
    es: {
      question: '¿Por qué los Simpson son amarillos?',
      answer: 'Para destacar en la televisión. 💛',
      comment: 'Más de treinta años y nadie les ha recomendado bloqueador solar.',
    },
  },
  {
    id: 85,
    category: 'pop-culture',
    en: {
      question: 'Which movie introduced Woody and Buzz?',
      answer: 'Toy Story. 🤠',
      comment: 'A cowboy and an astronaut. What could possibly go wrong?',
    },
    es: {
      question: '¿Qué película presentó a Woody y Buzz?',
      answer: 'Toy Story. 🤠',
      comment: 'Un vaquero y un astronauta. ¿Qué podría salir mal?',
    },
  },
  {
    id: 86,
    category: 'pop-culture',
    en: {
      question: 'Which band sang "Yellow Submarine"?',
      answer: 'The Beatles. 🚢',
      comment: 'Marine engineering has never been quite the same.',
    },
    es: {
      question: '¿Qué banda cantó "Yellow Submarine"?',
      answer: 'Los Beatles. 🚢',
      comment: 'La ingeniería naval nunca volvió a ser la misma.',
    },
  },
  {
    id: 87,
    category: 'pop-culture',
    en: {
      question: 'What kind of fish is Nemo?',
      answer: 'A clownfish. 🐠',
      comment: "The world's most expensive game of hide-and-seek.",
    },
    es: {
      question: '¿Qué tipo de pez es Nemo?',
      answer: 'Un pez payaso. 🐠',
      comment: 'El juego de escondidas más caro del mundo.',
    },
  },
  {
    id: 88,
    category: 'pop-culture',
    en: {
      question: "Thor's famous hammer?",
      answer: 'Mjolnir. ⚡',
      comment: "Apparently, a regular toolbox wasn't dramatic enough.",
    },
    es: {
      question: '¿Cómo se llama el famoso martillo de Thor?',
      answer: 'Mjolnir. ⚡',
      comment: 'Al parecer, una caja de herramientas normal no era suficientemente dramática.',
    },
  },
  {
    id: 89,
    category: 'pop-culture',
    en: {
      question: "What was Yoda's early proposed name?",
      answer: 'Minch Yoda. 👽',
      comment: 'The Force apparently intervened in the naming department.',
    },
    es: {
      question: '¿Qué nombre se propuso inicialmente para Yoda?',
      answer: 'Minch Yoda. 👽',
      comment: 'Al parecer, la Fuerza intervino en el departamento de nombres.',
    },
  },
  {
    id: 90,
    category: 'pop-culture',
    en: {
      question: "Disney's first animated feature film?",
      answer: 'Snow White and the Seven Dwarfs. 🍎',
      comment: 'Seven roommates and not one offered to do the dishes.',
    },
    es: {
      question: '¿Primer largometraje animado de Disney?',
      answer: 'Blancanieves y los siete enanitos. 🍎',
      comment: 'Siete compañeros de casa y ninguno se ofreció a lavar los platos.',
    },
  },
  {
    id: 91,
    category: 'pop-culture',
    en: {
      question: 'Which singer is nicknamed the Material Girl?',
      answer: 'Madonna. 🎤',
      comment: 'She turned a shopping list into a personality.',
    },
    es: {
      question: '¿Qué cantante es conocida como la Chica Material?',
      answer: 'Madonna. 🎤',
      comment: 'Convirtió una lista de compras en toda una personalidad.',
    },
  },
  {
    id: 92,
    category: 'pop-culture',
    en: {
      question: "Batman's city?",
      answer: 'Gotham City. 🦇',
      comment: "Apparently, the city council doesn't believe in streetlights.",
    },
    es: {
      question: '¿Cómo se llama la ciudad de Batman?',
      answer: 'Ciudad Gótica. 🦇',
      comment: 'Al parecer, el ayuntamiento no cree en el alumbrado público.',
    },
  },
  {
    id: 93,
    category: 'pop-culture',
    en: {
      question: 'Which movie features a flying house?',
      answer: 'Up. 🎈',
      comment: 'Finally, a moving company with absolutely no paperwork.',
    },
    es: {
      question: '¿Qué película tiene una casa voladora?',
      answer: 'Up. 🎈',
      comment: 'Por fin, una empresa de mudanzas sin ningún papeleo.',
    },
  },
  {
    id: 94,
    category: 'pop-culture',
    en: {
      question: "The Beatles' drummer?",
      answer: 'Ringo Starr. 🥁',
      comment: 'Even his name sounds like a drum solo.',
    },
    es: {
      question: '¿Baterista de los Beatles?',
      answer: 'Ringo Starr. 🥁',
      comment: 'Hasta su nombre suena como un solo de batería.',
    },
  },
  {
    id: 95,
    category: 'pop-culture',
    en: {
      question: "What planet is Avatar's Pandora orbiting?",
      answer: 'Polyphemus. 🌌',
      comment: 'Even fictional real estate comes with complicated addresses.',
    },
    es: {
      question: '¿Qué planeta orbita Pandora en Avatar?',
      answer: 'Polifemo. 🌌',
      comment: 'Hasta los bienes raíces ficticios tienen direcciones complicadas.',
    },
  },
  {
    id: 96,
    category: 'pop-culture',
    en: {
      question: "Harry Potter's owl?",
      answer: 'Hedwig. 🦉',
      comment: 'The only postal worker who accepted mice as payment.',
    },
    es: {
      question: '¿Cómo se llama la lechuza de Harry Potter?',
      answer: 'Hedwig. 🦉',
      comment: 'La única cartera que aceptaba ratones como pago.',
    },
  },
  {
    id: 97,
    category: 'pop-culture',
    en: {
      question: 'Who sang "Shake It Off"?',
      answer: 'Taylor Swift. 🎶',
      comment: 'A three-minute instruction manual for ignoring everybody.',
    },
    es: {
      question: '¿Quién canta "Shake It Off"?',
      answer: 'Taylor Swift. 🎶',
      comment: 'Un manual de tres minutos para ignorar a todo el mundo.',
    },
  },
  {
    id: 98,
    category: 'pop-culture',
    en: {
      question: "What does WALL-E's name stand for?",
      answer: 'Waste Allocation Load Lifter: Earth-Class. 🤖',
      comment: 'Apparently, even adorable robots have corporate job titles.',
    },
    es: {
      question: '¿Qué significan las siglas WALL-E?',
      answer: 'Waste Allocation Load Lifter: Earth-Class. 🤖',
      comment: 'Al parecer, hasta los robots adorables tienen títulos corporativos.',
    },
  },
  {
    id: 99,
    category: 'pop-culture',
    en: {
      question: "Spider-Man's real name?",
      answer: 'Peter Parker. 🕷️',
      comment: 'Great powers. Terrible work-life balance.',
    },
    es: {
      question: '¿Nombre real de Spider-Man?',
      answer: 'Peter Parker. 🕷️',
      comment: 'Grandes poderes. Pésimo equilibrio entre trabajo y vida personal.',
    },
  },
  {
    id: 100,
    category: 'pop-culture',
    en: {
      question: 'Which movie features a magical nanny with an umbrella?',
      answer: 'Mary Poppins. ☂️',
      comment: 'The only babysitter who arrives with her own weather system.',
    },
    es: {
      question: '¿Qué película tiene una niñera mágica con paraguas?',
      answer: 'Mary Poppins. ☂️',
      comment: 'La única niñera que llega con su propio sistema meteorológico.',
    },
  },
  {
    id: 101,
    category: 'food-and-drinks',
    en: {
      question: 'Which drink is made with a living culture of bacteria and yeast?',
      answer: 'Kombucha. 🫙',
      comment: "The world's smallest beverage-making partnership.",
    },
    es: {
      question: '¿Qué bebida se prepara con un cultivo de bacterias y levaduras?',
      answer: 'La kombucha. 🫙',
      comment: 'La sociedad fabricante de bebidas más pequeña del mundo.',
    },
  },
  {
    id: 102,
    category: 'food-and-drinks',
    en: {
      question: 'Where did the croissant originate?',
      answer: 'Austria. 🥐',
      comment: "France's pastry department has some explaining to do.",
    },
    es: {
      question: '¿Dónde se originó el antepasado del croissant?',
      answer: 'Austria. 🥐',
      comment: 'El departamento de repostería de Francia debe algunas explicaciones.',
    },
  },
  {
    id: 103,
    category: 'food-and-drinks',
    en: {
      question: 'What was an early version of ketchup made from?',
      answer: 'Fermented fish. 🐟',
      comment: 'Suddenly, tomatoes sound like an excellent improvement.',
    },
    es: {
      question: '¿De qué se hacía una versión antigua del kétchup?',
      answer: 'Pescado fermentado. 🐟',
      comment: 'De repente, los tomates parecen una excelente mejora.',
    },
  },
  {
    id: 104,
    category: 'food-and-drinks',
    en: {
      question: 'Which nut is actually a legume?',
      answer: 'The peanut. 🥜',
      comment: 'Living a double life since the beginning of agriculture.',
    },
    es: {
      question: '¿Qué fruto seco es en realidad una legumbre?',
      answer: 'El maní. 🥜',
      comment: 'Llevando una doble vida desde los inicios de la agricultura.',
    },
  },
  {
    id: 105,
    category: 'food-and-drinks',
    en: {
      question: 'Which fruit is technically a berry?',
      answer: 'The banana. 🍌',
      comment: "Meanwhile, strawberries aren't. Botany needs a meeting.",
    },
    es: {
      question: '¿Qué fruta es técnicamente una baya?',
      answer: 'El banano. 🍌',
      comment: 'Mientras tanto, las fresas no lo son. La botánica necesita una reunión.',
    },
  },
  {
    id: 106,
    category: 'food-and-drinks',
    en: {
      question: 'Which expensive coffee passes through an animal?',
      answer: 'Kopi luwak. ☕',
      comment: 'Somebody looked at animal poop and saw a business opportunity.',
    },
    es: {
      question: '¿Qué café caro pasa por el sistema digestivo de un animal?',
      answer: 'Kopi luwak. ☕',
      comment: 'Alguien vio excremento de animal y encontró una oportunidad de negocio.',
    },
  },
  {
    id: 107,
    category: 'food-and-drinks',
    en: {
      question: 'What colors were carrots historically?',
      answer: 'Purple and yellow, among others. 🥕',
      comment: 'Orange carrots were apparently a fashion decision.',
    },
    es: {
      question: '¿De qué colores eran antiguamente las zanahorias?',
      answer: 'Moradas y amarillas, entre otros. 🥕',
      comment: 'Al parecer, las zanahorias anaranjadas fueron una decisión de moda.',
    },
  },
  {
    id: 108,
    category: 'food-and-drinks',
    en: {
      question: 'What edible container became famous at the 1904 World’s Fair?',
      answer: 'The ice cream cone. 🍦',
      comment: "Finally, a dish you don't have to wash.",
    },
    es: {
      question: '¿Qué recipiente comestible se hizo famoso en la feria mundial de 1904?',
      answer: 'El cono de helado. 🍦',
      comment: 'Por fin, un plato que no hay que lavar.',
    },
  },
  {
    id: 109,
    category: 'food-and-drinks',
    en: {
      question: 'Which vegetable is actually a bunch of flower buds?',
      answer: 'Broccoli. 🥦',
      comment: "We've been eating bouquets this whole time.",
    },
    es: {
      question: '¿Qué vegetal está formado por muchos botones florales?',
      answer: 'El brócoli. 🥦',
      comment: 'Todo este tiempo hemos estado comiendo ramos de flores.',
    },
  },
  {
    id: 110,
    category: 'food-and-drinks',
    en: {
      question: 'What gives wasabi its sharp kick?',
      answer: 'Isothiocyanates. 🌶️',
      comment: 'A chemical name almost as painful as the experience.',
    },
    es: {
      question: '¿Qué le da al wasabi su picor intenso?',
      answer: 'Los isotiocianatos. 🌶️',
      comment: 'Un nombre químico casi tan doloroso como la experiencia.',
    },
  },
  {
    id: 111,
    category: 'food-and-drinks',
    en: {
      question: 'Which fruit floats because it contains air pockets?',
      answer: 'The apple. 🍎',
      comment: 'Nature invented the pool toy first.',
    },
    es: {
      question: '¿Qué fruta flota gracias a pequeñas bolsas de aire?',
      answer: 'La manzana. 🍎',
      comment: 'La naturaleza inventó primero los juguetes de piscina.',
    },
  },
  {
    id: 112,
    category: 'food-and-drinks',
    en: {
      question: 'Which language gave us the word "chocolate"?',
      answer: 'Nahuatl, through Spanish. 🍫',
      comment: 'Possibly the greatest linguistic contribution to dessert.',
    },
    es: {
      question: '¿De qué lengua proviene la palabra "chocolate"?',
      answer: 'Del náhuatl, a través del español. 🍫',
      comment: 'Posiblemente la mayor contribución lingüística a los postres.',
    },
  },
  {
    id: 113,
    category: 'food-and-drinks',
    en: {
      question: 'Which fruit contains a protein-breaking enzyme?',
      answer: 'Pineapple. 🍍',
      comment: "It's eating you back. Very slowly.",
    },
    es: {
      question: '¿Qué fruta contiene una enzima que descompone proteínas?',
      answer: 'La piña. 🍍',
      comment: 'También te está comiendo a vos. Muy lentamente.',
    },
  },
  {
    id: 114,
    category: 'food-and-drinks',
    en: {
      question: "What's the world's most expensive spice by weight?",
      answer: 'Saffron. 🌸',
      comment: 'A pinch can cost more than your lunch.',
    },
    es: {
      question: '¿Cuál es la especia más cara del mundo por peso?',
      answer: 'El azafrán. 🌸',
      comment: 'Una pizca puede costar más que tu almuerzo.',
    },
  },
  {
    id: 115,
    category: 'food-and-drinks',
    en: {
      question: 'Which famous soda was once marketed as a medicinal tonic?',
      answer: 'Coca-Cola. 🥤',
      comment: 'The pharmacy aisle took an unexpected turn.',
    },
    es: {
      question: '¿Qué famosa gaseosa se vendía como tónico medicinal?',
      answer: 'Coca-Cola. 🥤',
      comment: 'El pasillo de la farmacia tomó un rumbo inesperado.',
    },
  },
  {
    id: 116,
    category: 'food-and-drinks',
    en: {
      question: 'Which fruit is actually many fruits fused together?',
      answer: 'Pineapple. 🍍',
      comment: 'A whole fruit committee disguised as one.',
    },
    es: {
      question: '¿Qué fruta está formada por muchos frutos unidos?',
      answer: 'La piña. 🍍',
      comment: 'Todo un comité de frutas disfrazado de una sola.',
    },
  },
  {
    id: 117,
    category: 'food-and-drinks',
    en: {
      question: 'Why are flamingos pink?',
      answer: 'Pigments in their food. 🦩',
      comment: 'You really are what you eat.',
    },
    es: {
      question: '¿Por qué los flamencos son rosados?',
      answer: 'Por los pigmentos de su alimentación. 🦩',
      comment: 'De verdad somos lo que comemos.',
    },
  },
  {
    id: 118,
    category: 'food-and-drinks',
    en: {
      question: 'Which cheese is famous for its holes?',
      answer: 'Swiss cheese. 🧀',
      comment: 'The only food sold with missing pieces.',
    },
    es: {
      question: '¿Qué queso es famoso por sus agujeros?',
      answer: 'El queso suizo. 🧀',
      comment: 'El único alimento que se vende con pedazos faltantes.',
    },
  },
  {
    id: 119,
    category: 'food-and-drinks',
    en: {
      question: 'What food did the Aztecs use as money?',
      answer: 'Cacao beans. 🍫',
      comment: 'Finally, a currency you could turn into dessert.',
    },
    es: {
      question: '¿Qué alimento usaban los aztecas como dinero?',
      answer: 'Los granos de cacao. 🍫',
      comment: 'Por fin, una moneda que se podía convertir en postre.',
    },
  },
  {
    id: 120,
    category: 'food-and-drinks',
    en: {
      question: 'What makes popcorn pop?',
      answer: 'Steam pressure inside the kernel. 🍿',
      comment: 'The only snack that announces its own arrival.',
    },
    es: {
      question: '¿Qué hace que reviente el maíz para palomitas?',
      answer: 'La presión del vapor dentro del grano. 🍿',
      comment: 'El único bocadillo que anuncia su propia llegada.',
    },
  },
]