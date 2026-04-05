import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Trophy,
  MapPin, Lock,
  BookOpen, ChevronRight
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { GeoGuessrMap } from "./GeoGuessrMap";
import { getDisplayName } from "./WorldMap";
import { IntroSequence } from "./IntroSequence";
import { playSoundEffect } from "./soundUtils";
import confetti from "canvas-confetti";

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";

interface CultureFact {
  flag: string;
  geography: string;
  history: string;
  culture: string;
  funFact: string;
}

interface Level {
  id: number;
  country: string;
  mapCountry: string;
  imageUrl: string;
  clues: string[];
  difficulty: Difficulty;
  thiefClue: string;
  cultureFact: CultureFact;
}

interface LevelResult {
  levelIndex: number;
  country: string;
  selectedEnglish: string | null;
  correct: boolean;
  points: number;
  cluesUsed: number;
  difficulty: Difficulty;
  timedOut?: boolean;
}

// ─── Timer Config ─────────────────────────────────────────────────────────────

const TIMER_DURATION: Record<Difficulty, number> = {
  easy: 60,
  medium: 45,
  hard: 30,
};

// ─── Game Data ────────────────────────────────────────────────────────────────

const LEVELS: Level[] = [
  // ── Easy (6) ──
  {
    id: 1, difficulty: "easy",
    country: "France", mapCountry: "France",
    imageUrl: "https://images.pexels.com/photos/1461974/pexels-photo-1461974.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This Western European country's capital is considered one of the most romantic cities in the world.",
      "It's home to an iconic iron lattice tower built in 1889, originally intended to be dismantled after 20 years.",
      "This country is Europe's largest agricultural nation, world-famous for wine, cheese, and haute couture.",
    ],
    thiefClue: "Witnesses spotted the suspect near an iron tower at dusk, clutching a baguette and a bottle of wine...",
    cultureFact: {
      flag: "🇫🇷",
      geography: "France borders 8 countries and has coastlines on both the Atlantic Ocean and the Mediterranean Sea. It is the largest country in the European Union by area.",
      history: "France's Revolution of 1789 reshaped modern democracy worldwide. Napoleon's Code Civil still forms the basis of law in dozens of countries across 4 continents.",
      culture: "France is the world's most visited tourist destination, welcoming over 89 million visitors annually. It has more UNESCO World Heritage Sites than any other European country.",
      funFact: "The Eiffel Tower was originally planned to be demolished in 1909. It was saved because it could serve as a giant radio antenna — and today it attracts 7 million visitors per year!",
    },
  },
  {
    id: 2, difficulty: "easy",
    country: "Japan", mapCountry: "Japan",
    imageUrl: "https://images.pexels.com/photos/590478/pexels-photo-590478.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This East Asian island nation draws millions of visitors each spring to witness its famous cherry blossom season.",
      "It's the birthplace of anime culture, and home to global brands like Sony, Toyota, and Nintendo.",
      "This archipelago nation has a perfectly symmetrical volcanic mountain that has been an inspiration for artists for centuries.",
    ],
    thiefClue: "Witnesses reported seeing the suspect eating sushi under cherry blossom trees, with a bullet train ticket in hand...",
    cultureFact: {
      flag: "🇯🇵",
      geography: "Japan is an archipelago of 6,852 islands in the Pacific Ocean. Mount Fuji, its most famous peak at 3,776m, is an active stratovolcano that last erupted in 1707.",
      history: "Japan has the world's oldest continuous monarchy, with the Imperial family dating back over 2,600 years. The Meiji Restoration transformed it from feudalism to a modern power in just 50 years.",
      culture: "Japan has more Michelin-starred restaurants than any other country in the world. The concept of 'Wabi-sabi' — finding beauty in imperfection and transience — permeates all aspects of Japanese art and life.",
      funFact: "Japan has over 200 McDonald's locations that sell items you won't find anywhere else — like the Teriyaki Burger. Also, vending machines outnumber people in many districts of Tokyo!",
    },
  },
  {
    id: 3, difficulty: "easy",
    country: "Italy", mapCountry: "Italy",
    imageUrl: "https://images.pexels.com/photos/532263/pexels-photo-532263.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This boot-shaped Mediterranean peninsula is the birthplace of pizza, pasta, and one of the world's most influential ancient empires.",
      "Its capital city contains an ancient oval arena where gladiators once battled — still the world's largest standing amphitheater.",
      "The smallest country in the world is entirely enclosed within this nation's capital, and this country has more UNESCO World Heritage Sites than any other on Earth.",
    ],
    thiefClue: "A broken mosaic fragment and a half-eaten gelato cone were discovered near a massive ancient arena, its arches crumbling under centuries of history...",
    cultureFact: {
      flag: "🇮🇹",
      geography: "Italy is a peninsula extending into the central Mediterranean Sea, bordered by the Alps to the north. It encompasses two island territories — Sicily and Sardinia — and is home to three active volcanoes, including Vesuvius and Etna.",
      history: "The Roman Empire, founded in 27 BCE, shaped Western civilization through law, language, architecture, and governance. At its peak, Rome ruled over 70 million people across Europe, North Africa, and the Middle East.",
      culture: "Italy leads the world in UNESCO World Heritage Sites (58) and is considered the cradle of the Renaissance. Fashion giants Gucci, Prada, and Versace all began here, and the country produces more wine varieties than any other nation.",
      funFact: "The Colosseum could hold 50,000–80,000 spectators and had a retractable canvas roof (velarium) to shade the crowd. It also had an elaborate underground system of tunnels, lifts, and trapdoors used to surprise the audience with wild animals!",
    },
  },
  {
    id: 4, difficulty: "easy",
    country: "Greece", mapCountry: "Greece",
    imageUrl: "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This Mediterranean nation is considered the birthplace of democracy, the Olympics, and Western philosophy.",
      "A hilltop citadel in its capital city houses a 2,500-year-old marble temple to a goddess of wisdom — one of humanity's most iconic structures.",
      "Its thousands of whitewashed islands scattered across a deep blue sea draw millions of visitors each year.",
    ],
    thiefClue: "A philosopher's scroll replica and an ancient coin were found on a sun-bleached clifftop overlooking a volcanic caldera of impossibly deep blue water...",
    cultureFact: {
      flag: "🇬🇷",
      geography: "Greece has over 6,000 islands, of which approximately 227 are inhabited. Its coastline stretches 13,676 km — one of the longest in the world. Nearly 80% of the country is mountainous, with Mount Olympus rising 2,917 m as the highest peak.",
      history: "Ancient Greece (500–300 BCE) gave the world democracy, trial by jury, the Olympic Games, and the foundations of mathematics, science, and philosophy. Thinkers like Socrates, Plato, and Aristotle still shape modern thought.",
      culture: "Greece has the highest percentage of archaeological museum collections per capita in the world. The Greek language has the longest documented history of any living language, spanning over 3,400 years of written records.",
      funFact: "The word 'marathon' comes from the legendary run of the soldier Pheidippides, who ran approximately 40 km from Marathon to Athens in 490 BCE to announce a military victory — then promptly dropped dead. The modern marathon distance of 42.195 km was standardized at the 1908 London Olympics!",
    },
  },
  {
    id: 5, difficulty: "easy",
    country: "United Kingdom", mapCountry: "England",
    imageUrl: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This island nation's capital is home to a 1,000-year-old tower once used as a royal prison, a river palace, and a clock tower whose chimes are broadcast worldwide.",
      "The birthplace of Shakespeare, the Beatles, and the Industrial Revolution — this country once ruled an empire spanning nearly a quarter of the entire globe.",
      "Four distinct nations are united under one crown here; their anthem is sung at Wimbledon, where the world's oldest tennis tournament is held on grass courts.",
    ],
    thiefClue: "A red double-decker bus ticket and a royal guardsman's bearskin hat button were found near a Gothic clock tower overlooking a grey river at dawn...",
    cultureFact: {
      flag: "🇬🇧",
      geography: "The United Kingdom is an archipelago comprising Great Britain (England, Scotland, Wales) and Northern Ireland, plus over 6,000 smaller islands. No point in England is more than 113 km from tidal water.",
      history: "The British Empire was the largest empire in history, covering 24% of the world's land area at its peak in the 1920s. The UK was the birthplace of the Industrial Revolution in the 18th century, transforming global manufacturing, transport, and urban life.",
      culture: "The UK has produced some of the world's most influential literature, from Shakespeare and Dickens to J.K. Rowling and Tolkien. The BBC is the world's oldest national broadcasting organization. British pub culture, afternoon tea, and dry wit are internationally recognized cultural exports.",
      funFact: "Big Ben is actually the name of the bell inside the tower, not the clock or the tower itself (the tower was renamed 'Elizabeth Tower' in 2012). The bell weighs 13.5 tonnes and has been ringing every 15 minutes since 1859 — except during maintenance stops!",
    },
  },
  {
    id: 6, difficulty: "easy",
    country: "Canada", mapCountry: "Canada",
    imageUrl: "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "The world's second largest country by area, this nation's turquoise glacier-fed lakes and snow-capped Rocky Mountains are among the most photographed on Earth.",
      "This country produces over 71% of the world's maple syrup — its leaf appears on the red-and-white national flag — and ice hockey is considered the national pastime.",
      "It shares the world's longest international border with its southern neighbor and contains 20% of the planet's fresh water supply.",
    ],
    thiefClue: "A hockey puck and a maple syrup bottle were left on the dock of a shimmering turquoise lake surrounded by snow-capped peaks, far from any city...",
    cultureFact: {
      flag: "🇨🇦",
      geography: "Canada spans 6 time zones and borders three oceans — the Atlantic, Pacific, and Arctic. It contains more lakes than all other countries combined, including the Great Lakes shared with the USA. Hudson Bay is so large it affects Canada's regional climate and gravity.",
      history: "Indigenous peoples have inhabited Canada for over 15,000 years. French and British colonial competition shaped the country, culminating in British control after 1763. Canada gradually gained independence through the 20th century, becoming fully sovereign in 1982 with its own Constitution.",
      culture: "Canada is officially bilingual (English and French) and one of the world's most multicultural nations — over 22% of its population is foreign-born. The country invented basketball (by Canadian James Naismith in 1891) and has produced globally beloved artists like Drake, Celine Dion, and Justin Bieber.",
      funFact: "Canada has the longest coastline of any country on Earth — over 202,000 km, including islands. If you walked it at a steady pace, it would take you over 4.5 years without stopping. Also, Canada's national animal is the beaver, which was once the most economically important animal in North American history due to the fur trade!",
    },
  },
  // ── Medium (6) ──
  {
    id: 7, difficulty: "medium",
    country: "Egypt", mapCountry: "Egypt",
    imageUrl: "https://images.pexels.com/photos/262786/pexels-photo-262786.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This North African country is the cradle of one of humanity's oldest and most sophisticated civilizations.",
      "It contains the only remaining Wonder of the Ancient World — massive stone structures that have stood for over 4,500 years.",
      "A great river runs through this desert nation, and a half-lion, half-human stone monument has guarded these structures for millennia.",
    ],
    thiefClue: "Papyrus fragments and a replica ancient amulet were found near the foot of a triangular stone structure...",
    cultureFact: {
      flag: "🇪🇬",
      geography: "Over 90% of Egypt is desert. The Nile River — the world's longest at 6,650 km — creates a narrow fertile strip that has supported civilization for thousands of years.",
      history: "Ancient Egyptian civilization lasted over 3,000 years (3100–30 BCE). Pharaohs were considered living gods. The Rosetta Stone, discovered in 1799, finally allowed scholars to decode hieroglyphics in 1822.",
      culture: "Ancient Egyptians invented paper (papyrus), toothpaste, door locks, and the 365-day calendar. They were also among the first to practice surgery and use herbal medicine.",
      funFact: "The Great Pyramid of Giza was built from ~2.3 million stone blocks, each weighing 2.5–15 tons. It remained the tallest man-made structure on Earth for 3,800 years — until the Lincoln Cathedral was built in 1311!",
    },
  },
  {
    id: 8, difficulty: "medium",
    country: "Brazil", mapCountry: "Brazil",
    imageUrl: "https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This South American nation contains the world's largest tropical rainforest, often called 'the lungs of the Earth.'",
      "A giant Christ statue with outstretched arms overlooks a famous harbor — it's one of the New Seven Wonders of the World.",
      "This country hosts the world's biggest carnival and has won the FIFA World Cup more times than any other nation.",
    ],
    thiefClue: "A samba dancer's mask and a football were found at the base of a hilltop statue overlooking a stunning bay...",
    cultureFact: {
      flag: "🇧🇷",
      geography: "Brazil is the largest country in South America, covering nearly half the continent. The Amazon River discharges 20% of all fresh water that flows into Earth's oceans, more than the next 7 largest rivers combined.",
      history: "Brazil was a Portuguese colony for over 300 years (1500–1822) — making it the only country in the Americas where Portuguese is the official language. It declared independence peacefully, unlike most of its neighbors.",
      culture: "The Rio Carnival attracts over 2 million people per day — the largest carnival on Earth. Brazil has won the FIFA World Cup 5 times, and football (soccer) is considered a national religion.",
      funFact: "The Amazon rainforest is home to 10% of all species on Earth. It generates its own rainfall through 'flying rivers' — massive streams of water vapor carried by wind from the Atlantic to water the entire continent!",
    },
  },
  {
    id: 9, difficulty: "medium",
    country: "Australia", mapCountry: "Australia",
    imageUrl: "https://images.pexels.com/photos/995765/pexels-photo-995765.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This Oceanian country is unique — it is simultaneously a continent, a country, and an island.",
      "It's home to the world's largest coral reef system, stretching approximately 2,300 kilometers.",
      "Its iconic marsupials are globally recognized, and its largest city features a famous shell-shaped performing arts venue on the harbor.",
    ],
    thiefClue: "A toy kangaroo and a koala postcard were discovered near a waterfront concert hall with distinctive shell-shaped roofs...",
    cultureFact: {
      flag: "🇦🇺",
      geography: "Australia is the world's 6th largest country and the flattest, driest inhabited continent. It has the world's longest fence — the Dingo Fence at 5,614 km — built to protect sheep from wild dogs.",
      history: "Aboriginal Australians have one of the oldest continuous cultures on Earth, dating back at least 65,000 years. European settlement began in 1788 when Britain established a penal colony at Sydney Cove.",
      culture: "Australia is home to 80%+ of its plant and animal species found nowhere else on Earth. The Sydney Opera House, with its iconic sail-like shells, took 14 years and over 10,000 workers to build.",
      funFact: "The Sydney Opera House's roof is made of over 1 million Swedish-made tiles, each specially treated to be self-cleaning. The design was so revolutionary that it helped create entirely new engineering techniques!",
    },
  },
  {
    id: 10, difficulty: "medium",
    country: "India", mapCountry: "India",
    imageUrl: "https://images.pexels.com/photos/1260801/pexels-photo-1260801.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "A Mughal emperor built a white marble mausoleum for his beloved wife in the 17th century — considered one of the greatest monuments to love ever constructed.",
      "This South Asian nation is the birthplace of four major world religions and home to the world's largest film industry by output.",
      "Its population recently surpassed 1.4 billion, making it the world's most populous country, and it's bordered by the Himalayas to the north.",
    ],
    thiefClue: "A fragment of intricate marble inlay work and a thread of gold embroidery were found beside a perfectly symmetrical reflecting pool leading to a white domed tomb...",
    cultureFact: {
      flag: "🇮🇳",
      geography: "India is the 7th largest country by area, featuring the Himalayan mountain range in the north, the Thar Desert in the west, tropical coastlines, and the fertile Ganges plain. The subcontinent was formed when a separate tectonic plate collided with Asia 50 million years ago.",
      history: "The Indus Valley Civilization (3300–1300 BCE) was one of the world's earliest urban cultures. India was colonized by Britain from 1858–1947, then achieved independence through Mahatma Gandhi's pioneering non-violent resistance movement.",
      culture: "India produces over 1,800 films per year — more than any other country. It has 22 official languages and over 1,600 dialects. The game of chess was invented in India, and the concept of 'zero' as a number was developed by Indian mathematician Brahmagupta in 628 CE.",
      funFact: "The Taj Mahal changes color throughout the day — it appears pinkish at dawn, white at noon, and golden at sunset. Emperor Shah Jahan reportedly had the hands of the craftsmen cut off after completion so they could never create anything more beautiful!",
    },
  },
  // ── Medium (continued) ──
  {
    id: 11, difficulty: "medium",
    country: "Peru", mapCountry: "Peru",
    imageUrl: "https://images.pexels.com/photos/1570610/pexels-photo-1570610.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "Hidden in the mist high in the Andes, an ancient stone city abandoned by its builders was only 'rediscovered' by the outside world in 1911 — and no one is certain why it was built.",
      "This country was the heart of the largest pre-Columbian empire in the Americas, whose engineers built 40,000 km of mountain roads without wheels, iron tools, or written language.",
      "Its highland lake at 3,812 m elevation is the world's highest navigable lake, and local people have lived on floating islands of woven reeds here for centuries.",
    ],
    thiefClue: "A fragment of Incan stonework — fitted so perfectly it needed no mortar — and a dried coca leaf were found on a misty mountaintop citadel overlooking a river canyon...",
    cultureFact: {
      flag: "🇵🇪",
      geography: "Peru contains three distinct geographic zones: the Pacific coastal desert, the Andean highlands (with peaks over 6,000 m), and the Amazon rainforest. The Amazon River itself begins in Peru's Andes, fed by glacier meltwater from the Andes mountain range.",
      history: "The Inca Empire (1438–1533) was the largest empire in pre-Columbian America. Spanish conquistador Francisco Pizarro conquered it with just 168 men, exploiting internal civil war. Peru declared independence from Spain in 1821, led in part by Simón Bolívar and José de San Martín.",
      culture: "Peruvian cuisine is considered one of the world's great culinary traditions — Lima has been named 'World's Best Culinary Destination' multiple times. Ceviche (raw fish cured in lime juice) and lomo saltado (stir-fried beef) are internationally celebrated. Machu Picchu draws over 1 million visitors per year.",
      funFact: "Machu Picchu was built around 1450 CE and abandoned less than 100 years later — possibly due to smallpox arriving before the Spanish conquistadors. The site was so remote that it was completely unknown to the outside world until 1911, when American historian Hiram Bingham was guided there by a local Quechua boy!",
    },
  },
  {
    id: 12, difficulty: "medium",
    country: "Thailand", mapCountry: "Thailand",
    imageUrl: "https://images.pexels.com/photos/11105015/pexels-photo-11105015.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This Southeast Asian nation is the only country in the region never colonized by a European power — its name literally means 'Land of the Free.'",
      "Hundreds of gilded Buddhist temples dot this country's landscape; its royal palace complex contains a sacred emerald Buddha statue carved from a single piece of jasper.",
      "A stir-fried rice noodle dish from this country's street food stalls has become one of the world's most beloved international dishes.",
    ],
    thiefClue: "A golden Buddha amulet and lotus flower offerings were found floating in a canal market at dawn, surrounded by fragrant jasmine garlands and the smoke of incense...",
    cultureFact: {
      flag: "🇹🇭",
      geography: "Thailand is located in the heart of mainland Southeast Asia, bordered by Myanmar, Laos, Cambodia, and Malaysia. It has extensive coastlines on both the Gulf of Thailand and the Andaman Sea, with over 1,400 islands. The Chao Phraya River delta forms the fertile central plains.",
      history: "The Thai kingdom has roots dating to the Sukhothai Kingdom in the 13th century. Unlike its neighbors, Thailand (then Siam) maintained independence during the colonial era by adeptly playing French and British powers against each other. The monarchy, established in the 13th century, is one of the world's longest-reigning dynasties.",
      culture: "Thailand is the world's largest Buddhist nation by percentage of practitioners (95% Theravada Buddhist). Muay Thai (Thai boxing) is the national sport. Thai street food culture is UNESCO-recognized; Bangkok has more street food stalls per capita than almost any city on Earth.",
      funFact: "The Grand Palace complex in Bangkok houses over 100 buildings and has been continuously expanded since 1782. The Emerald Buddha — Thailand's most sacred object — is actually made of green jasper, not emerald. The king himself ceremonially changes the statue's golden robes three times a year, according to the season!",
    },
  },
  // ── Hard (6) ──
  {
    id: 13, difficulty: "hard",
    country: "Iceland", mapCountry: "Iceland",
    imageUrl: "https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This remote Nordic island nation sits directly on the Mid-Atlantic Ridge — one of the most geologically active places on Earth, with erupting volcanoes, spouting geysers, and steaming lava fields.",
      "Roughly one in ten of its citizens has published a book, and the long winter nights are lit by curtains of green and purple light dancing across the sky.",
      "Despite its name suggesting cold wasteland, this nation has no mosquitoes, runs almost entirely on renewable geothermal and hydroelectric energy, and was the first country to elect a female president.",
    ],
    thiefClue: "A piece of obsidian volcanic glass and an aurora photograph were found near a steaming geyser erupting every 6 minutes like clockwork, surrounded by a desolate lava plain...",
    cultureFact: {
      flag: "🇮🇸",
      geography: "Iceland sits atop the Mid-Atlantic Ridge where the Eurasian and North American tectonic plates meet, making it one of the most volcanically active places on Earth. Roughly 11% of the country is covered by glaciers, including Vatnajökull — Europe's largest glacier.",
      history: "Iceland was settled by Norse Vikings around 874 CE and established the Althing in 930 CE — the world's oldest functioning parliament, making it the birthplace of modern democratic governance. It was ruled by Norway then Denmark until gaining full independence in 1944.",
      culture: "Iceland has one of the world's highest literacy rates and per-capita book publication rates — over 10% of Icelanders will publish a book in their lifetime. The sagas written in 13th-century Iceland are considered foundational works of European literature.",
      funFact: "Iceland has no mosquitoes — scientists believe the freezing-and-thawing cycle of its ground disrupts mosquito development. The country runs on nearly 100% renewable energy from geothermal and hydropower. The Blue Lagoon's milky-blue water is actually runoff from a nearby geothermal power plant!",
    },
  },
  {
    id: 14, difficulty: "hard",
    country: "Morocco", mapCountry: "Morocco",
    imageUrl: "https://images.pexels.com/photos/210478/pexels-photo-210478.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This North African kingdom's ancient medina cities feature a labyrinthine tangle of medieval souks — markets selling spices, leather, ceramics, and textiles in a sensory overload of color and scent.",
      "It's the only African country with coastlines on both the Atlantic Ocean and the Mediterranean Sea, and its Saharan dunes rise to over 150 meters in the southeast.",
      "A 9th-century university founded here is recognized as the world's oldest continuously operating degree-granting institution.",
    ],
    thiefClue: "A fragment of hand-painted zellige tile and a small satchel of argan oil were found in a maze of narrow market alleyways, the air thick with saffron, cumin, and hammered copper...",
    cultureFact: {
      flag: "🇲🇦",
      geography: "Morocco straddles northwestern Africa and is separated from Europe by just 14 km of water at the Strait of Gibraltar. It contains four mountain ranges including the Atlas and Rif, the Sahara Desert in the east and south, and fertile Atlantic coastal plains.",
      history: "Morocco has been ruled continuously by the Alaoui dynasty since the 17th century — one of the world's longest-ruling royal families. It was divided between French and Spanish protectorates in 1912, then regained independence in 1956 under King Mohammed V.",
      culture: "Moroccan architecture is famous for its geometric zellige tilework, carved plaster arabesques, and cedar woodwork. Mint tea — poured from height to create a frothy head — is the symbol of Moroccan hospitality. Morocco is the world's largest exporter of argan oil and phosphates.",
      funFact: "The University of al-Qarawiyyin in Fez was founded in 859 CE by a woman — Fatima al-Fihri — and is recognized by UNESCO as the world's oldest continuously operating university. Fez's medina, with over 9,000 streets, is the world's largest car-free urban area!",
    },
  },
  {
    id: 15, difficulty: "hard",
    country: "Vietnam", mapCountry: "Vietnam",
    imageUrl: "https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "Over 1,600 limestone karst islands rise dramatically from the emerald waters of a UNESCO-listed bay in this Southeast Asian nation's northeast — many hollow with ancient cave systems.",
      "This long, narrow S-shaped country stretches 1,650 km from north to south and has successfully repelled invasions by the Mongols, Chinese, French, and American forces across its history.",
      "Its noodle soup — served from street carts at dawn with fresh herbs and a squeeze of lime — has become one of the world's most beloved comfort foods.",
    ],
    thiefClue: "A conical straw hat and a bowl of steaming pho were found abandoned on a wooden boat drifting between towering limestone pillars rising from a mist-covered jade-green bay at sunrise...",
    cultureFact: {
      flag: "🇻🇳",
      geography: "Vietnam is an S-shaped country along the eastern coast of the Indochinese Peninsula, bordered by China, Laos, and Cambodia. The Mekong River delta in the south and the Red River delta in the north are the country's agricultural heartlands. Ha Long Bay contains 1,969 named limestone islands.",
      history: "Vietnam has one of Asia's longest histories of resisting foreign occupation — a 1,000-year period of Chinese domination ended in 938 CE, and the country later repelled three Mongol invasions. After French colonization (1887–1954) and the Vietnam War (1955–1975), the country reunified in 1976.",
      culture: "Vietnamese cuisine is renowned for its fresh herbs, balance of flavors, and street food culture. Hội An Ancient Town, a UNESCO-listed trading port, showcases a blend of Vietnamese, Chinese, Japanese, and European architectural influences. The áo dài national dress combines elegance with cultural identity.",
      funFact: "Ha Long Bay's name translates to 'Descending Dragon Bay' from a legend that a dragon family spat jade and jewels that became the islands. The bay contains over 1,000 caves, some only discovered in the 1990s. Vietnam is the world's 2nd largest coffee exporter after Brazil!",
    },
  },
  {
    id: 16, difficulty: "hard",
    country: "Bolivia", mapCountry: "Bolivia",
    imageUrl: "https://images.pexels.com/photos/2613110/pexels-photo-2613110.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This landlocked South American country is home to the world's largest salt flat — over 10,000 square kilometers of pure white crystallized salt that mirrors the sky after rain.",
      "It is one of only two landlocked nations in South America and one of the highest countries in the world, with one of its two capitals sitting at over 3,600 meters elevation.",
      "This nation has the largest proportion of indigenous population in South America — over 40% identify as Quechua or Aymara — and vibrant cholita women in bowler hats are an iconic cultural symbol.",
    ],
    thiefClue: "A salt crystal souvenir and a colorful woven aguayo cloth were found on an endless white expanse that perfectly mirrors the entire sky, creating an infinite illusion...",
    cultureFact: {
      flag: "🇧🇴",
      geography: "Bolivia is the highest and most isolated country in South America. The Altiplano plateau averages 3,750 m elevation. Lake Titicaca, on the border with Peru, is the world's highest navigable lake at 3,812 m. The eastern lowlands contain part of the Amazon basin.",
      history: "Bolivia was part of the Inca Empire before Spanish conquest in 1524. It declared independence in 1825, named after Simón Bolívar, the liberator. Bolivia lost its coastline to Chile in the War of the Pacific (1879–1884) and has been landlocked ever since — it still maintains a navy on Lake Titicaca.",
      culture: "Bolivia has two capitals: Sucre (constitutional) and La Paz (seat of government) — the world's highest administrative capital at 3,650 m. Cholita libre (wrestling performed by indigenous women in traditional dress) has become a celebrated cultural phenomenon and tourist attraction.",
      funFact: "Salar de Uyuni contains over half the world's known lithium reserves, making Bolivia a pivotal player in the future of electric vehicles. After rain, a thin layer of water turns the entire flat into the world's largest natural mirror — photographers travel from around the globe to capture the surreal illusion of walking in the sky!",
    },
  },
  {
    id: 17, difficulty: "hard",
    country: "Georgia", mapCountry: "Georgia",
    imageUrl: "https://images.unsplash.com/photo-1565008576549-57569a49371d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "This small Caucasus nation has the world's oldest documented winemaking tradition — over 8,000 years — using large clay vessels buried underground to ferment grapes.",
      "Its capital's old town is famous for domed sulfurous bathhouses fed by natural hot springs, with a district unchanged since medieval times.",
      "This country uses a unique script, one of only 14 alphabets in the world, said to have been invented by a king in the 5th century AD specifically for this nation.",
    ],
    thiefClue: "A clay amphora shard and a sulfur-scented towel were found in a cobblestoned alley beside steaming domed bathhouses, ancient carved balconies looming overhead...",
    cultureFact: {
      flag: "🇬🇪",
      geography: "Georgia sits at the crossroads of Eastern Europe and Western Asia, bordered by the Black Sea to the west and the Greater Caucasus mountain range to the north. It shares borders with Russia, Turkey, Armenia, and Azerbaijan. Its landscape compresses alpine glaciers, subtropical coastline, and desert steppe within a small area.",
      history: "Georgia is one of the earliest Christian nations — converting in 327 CE. It was absorbed into the Russian Empire in 1801, became part of the Soviet Union in 1921, and gained independence again in 1991. The ancient Silk Road ran through its valleys for over 1,500 years.",
      culture: "Georgian polyphonic singing — using complex three-part harmony — is one of UNESCO's oldest recognized Intangible Cultural Heritages. The country has its own alphabet (Georgian script), one of only 14 original alphabets created in human history. Georgian cuisine, especially khachapuri (cheese bread) and khinkali (dumplings), has gained global recognition.",
      funFact: "Georgia is considered the birthplace of wine — archaeologists found grape seeds and residue in clay vessels (kvevri) dating to 6000 BCE in a village south of Tbilisi. The Georgian word for wine is 'ghvino,' which is believed to be the root of the English and Latin words for wine!",
    },
  },
  {
    id: 18, difficulty: "hard",
    country: "Sri Lanka", mapCountry: "Sri Lanka",
    imageUrl: "https://images.pexels.com/photos/1764068/pexels-photo-1764068.jpeg?auto=compress&cs=tinysrgb&w=1080&h=720&dpr=1",
    clues: [
      "This teardrop-shaped island south of India gave the world its most prized tea blends — its rolling highland estates, carpeted in vivid green, still supply much of the planet's tea.",
      "A 5th-century king built an impenetrable palace and mirror-walled gardens atop a 200-meter sheer rock column rising from the jungle floor — its cliff frescoes are compared to the Sistine Chapel.",
      "Known as Ceylon until 1972, this island sits at the ancient crossroads of Arab, African, Chinese, and Indian spice trade routes, and was the world's primary source of cinnamon for centuries.",
    ],
    thiefClue: "A dried cinnamon stick and a fragment of orange-tinted palace fresco were discovered on the wind-swept summit of a solitary flat-topped rock rising dramatically from jungle — the only way up is through a spiral staircase cut into its sheer face...",
    cultureFact: {
      flag: "🇱🇰",
      geography: "Sri Lanka is a pear-shaped island of 65,610 km² in the Indian Ocean, separated from India by the 22–33 km wide Palk Strait. The central highlands rise to 2,524 m; the ancient city of Kandy sits in a scenic mountain basin. The coastline alternates between lagoons, beaches, and mangroves.",
      history: "Sri Lanka has a recorded history spanning over 3,000 years, with chronicles written in the 5th century BCE. It was colonized by the Portuguese (1505), Dutch (1658), and finally British (1815–1948) who transformed the island's economy by introducing tea and rubber plantations. It gained independence in 1948.",
      culture: "Sri Lanka is home to eight UNESCO World Heritage Sites — an extraordinary density for a small island. The ancient hydraulic civilization built over 30,000 reservoirs (tanks) that still irrigate the country today. Sri Lankan cuisine uses the world's widest variety of spices per dish of any national cuisine.",
      funFact: "Sigiriya Rock Fortress was built by King Kashyapa in 477 CE, who chose the dramatic rock as a fortress-palace after usurping the throne. The 'Mirror Wall' was once polished so highly that the king could see his reflection in it — and it's covered with ancient graffiti left by visitors over 1,000 years ago, some of the world's oldest surviving secular poetry!",
    },
  },
];

// ─── Suspects ─────────────────────────────────────────────────────────────────

const SUSPECTS: Record<number, { alias: string; height: string; build: string; hair: string; method: string; lastSeen: string }> = {
  1:  { alias: "The Phantom",      height: "183 cm", build: "Athletic",    hair: "Dark, slicked back", method: "Steals paintings, leaves a single white rose",          lastSeen: "72 hrs ago" },
  2:  { alias: "Kitsune",          height: "171 cm", build: "Lean",        hair: "Black, cropped",     method: "Bypasses laser grids, never triggers alarms",           lastSeen: "48 hrs ago" },
  3:  { alias: "Il Fantasma",      height: "178 cm", build: "Medium",      hair: "Silver-streaked",    method: "Forges documents, impersonates curators",               lastSeen: "60 hrs ago" },
  4:  { alias: "The Architect",    height: "190 cm", build: "Tall, broad", hair: "Grey, cropped short",method: "Memorizes blueprints, uses structural blind spots",      lastSeen: "36 hrs ago" },
  5:  { alias: "Cipher",           height: "165 cm", build: "Slight",      hair: "Auburn, wavy",       method: "Cracks vault codes without tools, leaves no trace",      lastSeen: "55 hrs ago" },
  6:  { alias: "The Chameleon",    height: "175 cm", build: "Average",     hair: "Changes frequently", method: "Master of disguise, 12 known identities",               lastSeen: "40 hrs ago" },
  7:  { alias: "Lady Vex",         height: "168 cm", build: "Lean",        hair: "Platinum blonde",    method: "Social engineering, seduces museum staff",              lastSeen: "30 hrs ago" },
  8:  { alias: "The Clockmaker",   height: "172 cm", build: "Stocky",      hair: "Brown, thinning",    method: "Times heists to the second, obsessed with precision",   lastSeen: "44 hrs ago" },
  9:  { alias: "Mirage",           height: "180 cm", build: "Athletic",    hair: "Natural black",      method: "Uses holographic decoys, never seen directly",          lastSeen: "28 hrs ago" },
  10: { alias: "The Professor",    height: "169 cm", build: "Slight",      hair: "White, disheveled",  method: "Exploits academic access, steals research artifacts",   lastSeen: "52 hrs ago" },
  11: { alias: "Scorpio",          height: "185 cm", build: "Muscular",    hair: "Shaved",             method: "Brute-force entry, disables security physically",       lastSeen: "18 hrs ago" },
  12: { alias: "The Weaver",       height: "162 cm", build: "Petite",      hair: "Long, dark braided", method: "Plants accomplices months in advance",                  lastSeen: "66 hrs ago" },
  13: { alias: "Vandal X",         height: "177 cm", build: "Medium",      hair: "Dyed red",           method: "Steals and replaces with perfect fakes",                lastSeen: "22 hrs ago" },
  14: { alias: "The Ghost",        height: "174 cm", build: "Lean",        hair: "Unknown",            method: "Never photographed, identity unknown to Interpol",      lastSeen: "Unknown" },
  15: { alias: "Madam Zero",       height: "170 cm", build: "Slender",     hair: "Black, severe cut",  method: "Corrupts guards with money, vanishes before discovery", lastSeen: "34 hrs ago" },
  16: { alias: "The Navigator",    height: "182 cm", build: "Athletic",    hair: "Sandy brown",        method: "Uses transport networks, moves cargo through ports",     lastSeen: "20 hrs ago" },
  17: { alias: "Eclipse",          height: "176 cm", build: "Medium",      hair: "Natural grey",       method: "Operates only at night, light-sensitive equipment",     lastSeen: "12 hrs ago" },
  18: { alias: "The Sovereign",    height: "188 cm", build: "Commanding",  hair: "Dark, long",         method: "Bribes officials, operates through shell organizations", lastSeen: "8 hrs ago"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy", color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/40", dot: "bg-emerald-400",
    gradient: "from-emerald-900/40", icon: "🟢", timerColor: "bg-emerald-500",
    maxClues: 3,
  },
  medium: {
    label: "Medium", color: "text-amber-400",
    bg: "bg-amber-500/20 border-amber-500/40", dot: "bg-amber-400",
    gradient: "from-amber-900/40", icon: "🟡", timerColor: "bg-amber-500",
    maxClues: 2,
  },
  hard: {
    label: "Hard", color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/40", dot: "bg-red-400",
    gradient: "from-red-900/40", icon: "🔴", timerColor: "bg-red-500",
    maxClues: 1,
  },
};

function calcPoints(cluesUsed: number): number {
  if (cluesUsed === 0) return 30;
  if (cluesUsed === 1) return 20;
  if (cluesUsed === 2) return 10;
  return 5;
}

function fireConfetti() {
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors: ["#22c55e", "#f59e0b", "#6366f1", "#ec4899", "#38bdf8"] });
}

function fireSmallConfetti() {
  confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 }, colors: ["#22c55e", "#4ade80"] });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Typewriter reveal animation
function TypewriterText({ text, speed = 22 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{displayed}{!done && <span className="tw-cursor" />}</span>;
}

function DifficultyBadge({ d, size = "sm" }: { d: Difficulty; size?: "sm" | "md" }) {
  const colors: Record<Difficulty, string> = { easy: '#3a7a2a', medium: '#8b6914', hard: '#8b1c1c' };
  const c = colors[d];
  return (
    <span style={{
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: size === 'md' ? 16 : 13,
      fontWeight: 900,
      letterSpacing: '0.18em',
      color: c,
      border: `1.5px solid ${c}`,
      padding: '1px 6px 2px',
      borderRadius: 1,
      background: 'rgba(240,230,200,0.06)',
      display: 'inline-block',
      lineHeight: 1.4,
    }}>
      {d.toUpperCase()}
    </span>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span key={i} style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 16,
            lineHeight: 1,
            color: done ? '#1a0e04' : active ? 'rgba(26,14,4,0.55)' : 'rgba(26,14,4,0.2)',
            transition: 'color 0.4s',
          }}>
            {done ? '■' : '□'}
          </span>
        );
      })}
    </div>
  );
}

// Detective ink-box countdown timer — golden on dark wood
function CountdownTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = timeLeft / total;
  const barColor = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444';
  const shouldPulse = pct < 0.15;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', width: '100%', maxWidth: 500,
      margin: '0 auto', padding: '6px 16px',
    }}>
      {/* Left label */}
      <span style={{
        fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700,
        color: '#c8a882', letterSpacing: '0.15em', marginRight: 12,
        flexShrink: 0, lineHeight: 1,
      }}>TIME</span>

      {/* Center bar */}
      <div style={{
        flex: 1, height: 12, borderRadius: 6,
        background: 'rgba(0,0,0,0.4)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct * 100}%`,
          background: barColor,
          borderRadius: 6,
          transition: 'width 1s linear, background-color 0.5s ease',
          animation: shouldPulse ? 'timer-bar-pulse 0.5s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* Right number + SEC */}
      <div style={{ marginLeft: 12, display: 'flex', alignItems: 'baseline', flexShrink: 0 }}>
        <span style={{
          fontFamily: "'Oswald', sans-serif", fontSize: 25, fontWeight: 700,
          color: '#f0e8d4', lineHeight: 1,
        }}>{String(timeLeft).padStart(2, '0')}</span>
        <span style={{
          fontSize: 14, color: '#c8a882', letterSpacing: '0.1em',
          marginLeft: 4, fontFamily: "'Oswald', sans-serif",
        }}>SEC</span>
      </div>
    </div>
  );
}

function flagEmojiToCode(flag: string): string {
  const points = [...flag].map(c => c.codePointAt(0)! - 0x1F1E6 + 65);
  return String.fromCharCode(...points).toLowerCase();
}

// Cultural Knowledge Card Modal — Detective Noir Case Debrief
function CultureCard({ level, resolvedImageUrl, isCorrect, points, onContinue, isLast }: {
  level: Level;
  resolvedImageUrl: string;
  isCorrect: boolean;
  points: number;
  onContinue: () => void;
  isLast: boolean;
}) {
  const { cultureFact } = level;

  const facts = [
    { icon: "🗺", label: "GEOGRAPHY", color: '#8b6914', text: cultureFact.geography },
    { icon: "📜", label: "HISTORY", color: '#6b3a1f', text: cultureFact.history },
    { icon: "🎭", label: "CULTURE", color: '#3a5c2a', text: cultureFact.culture },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(5,3,1,0.94)', backdropFilter: 'blur(14px)', zIndex: 3000,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -80, scaleY: 0.05 }}
        animate={{ opacity: 1, y: 0, scaleY: 1 }}
        exit={{ opacity: 0, y: -40, scaleY: 0.1 }}
        transition={{ type: "spring", stiffness: 200, damping: 28 }}
        style={{
          width: '100%', maxWidth: 620,
          transformOrigin: 'top center',
          background: '#f2edd8',
          backgroundImage: [
            'repeating-linear-gradient(transparent, transparent 22px, rgba(0,0,40,0.05) 22px, rgba(0,0,40,0.05) 23px)',
            'radial-gradient(ellipse at 5% 95%, rgba(80,50,10,0.12) 0%, transparent 35%)',
            'radial-gradient(ellipse at 95% 5%, rgba(60,38,8,0.09) 0%, transparent 30%)',
          ].join(', '),
          backgroundSize: '100% 23px, auto, auto',
          backgroundPosition: '0 8px, 0 0, 0 0',
          border: '1px solid rgba(80,50,10,0.3)',
          borderTop: '4px solid #3b1d07',
          borderRadius: 2,
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 4px 8px 28px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          fontFamily: "'Courier New', Courier, monospace",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Newspaper masthead header ── */}
        <div style={{ position: 'relative', padding: '16px 20px 14px', textAlign: 'center', overflow: 'hidden', borderBottom: '3px double rgba(30,14,2,0.55)' }}>
          {/* Blurred photo background — sepia vintage print */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${resolvedImageUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(3px) sepia(0.65) saturate(0.7) brightness(0.72)',
            transform: 'scale(1.08)',
          }} />
          {/* Aged paper overlay — newsprint tint */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(240,228,190,0.55) 0%, rgba(220,210,170,0.62) 100%)',
          }} />
          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(20,10,2,0.45) 100%)',
          }} />
          {/* Top rule line */}
          <div style={{ borderTop: '1px solid rgba(30,14,2,0.4)', marginBottom: 10, position: 'relative' }} />

          {/* Stamp — rubber ink */}
          <motion.div
            initial={{ scale: 2.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: -11 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 18 }}
            style={{
              position: 'absolute', top: 18, right: 16,
              border: `2.5px solid ${isCorrect ? 'rgba(30,90,20,0.85)' : 'rgba(140,20,20,0.85)'}`,
              borderRadius: 2,
              padding: '3px 8px',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 16, fontWeight: 800, letterSpacing: '0.18em',
              color: isCorrect ? 'rgba(20,100,30,0.9)' : 'rgba(160,20,20,0.9)',
              background: isCorrect ? 'rgba(20,100,30,0.07)' : 'rgba(160,20,20,0.07)',
              zIndex: 10, userSelect: 'none',
              transform: 'rotate(-11deg)',
            }}
          >
            {isCorrect ? "CAUGHT" : "ESCAPED"}
          </motion.div>

          {/* Flag + country name — large masthead style */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ marginBottom: 8, lineHeight: 1, position: 'relative' }}
          >
            <img
              src={`https://flagcdn.com/w80/${flagEmojiToCode(cultureFact.flag)}.png`}
              alt={level.country}
              style={{ width: 80, height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </motion.div>

          <div style={{
            fontFamily: "'Oswald', sans-serif", fontWeight: 800,
            fontSize: '2.4rem', letterSpacing: '0.1em',
            color: '#1a0a02', marginBottom: 4,
            textTransform: 'uppercase',
            position: 'relative',
            textShadow: '0 1px 3px rgba(240,225,180,0.6)',
          }}>{level.country}</div>

          {/* Points strip — like a newspaper kicker */}
          <div style={{
            display: 'inline-block',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 23, letterSpacing: '0.16em', fontWeight: 800,
            color: isCorrect ? '#1a5c10' : '#7a1010',
            borderTop: `1.5px solid ${isCorrect ? 'rgba(20,100,20,0.5)' : 'rgba(120,10,10,0.5)'}`,
            borderBottom: `1.5px solid ${isCorrect ? 'rgba(20,100,20,0.5)' : 'rgba(120,10,10,0.5)'}`,
            padding: '2px 10px', marginTop: 2,
            position: 'relative',
            background: 'rgba(240,228,190,0.45)',
          }}>
            {isCorrect ? `+ ${points} PTS  ·  CASE CLOSED` : "SUSPECT AT LARGE — FILE OPEN"}
          </div>

          <div style={{ borderTop: '1px solid rgba(30,14,2,0.25)', marginTop: 12, position: 'relative' }} />
        </div>

        {/* ── Fact cards — newspaper column sections ── */}
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
          {facts.map(({ icon, label, color, text }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.08 }}
              style={{
                borderLeft: `3px solid ${color}`,
                paddingLeft: 10,
                paddingRight: 6,
                paddingTop: 4,
                paddingBottom: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 13, fontWeight: 900, letterSpacing: '0.22em',
                  color, textTransform: 'uppercase',
                }}>{label}</span>
              </div>
              <p style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 18, lineHeight: 1.7, color: '#1a0e04', margin: 0, letterSpacing: '0.01em',
              }}>{text}</p>
            </motion.div>
          ))}

          {/* Wild Fact — inset box with double border (newspaper "sidebar" style) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            style={{
              border: '2px solid rgba(30,14,2,0.6)',
              outline: '1px solid rgba(30,14,2,0.2)',
              outlineOffset: 3,
              borderRadius: 1,
              padding: '7px 10px',
              marginTop: 4,
              background: 'rgba(30,14,2,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>🤯</span>
              <span style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 13, fontWeight: 900, letterSpacing: '0.22em',
                color: '#5c3208', textTransform: 'uppercase',
              }}>FIELD NOTE</span>
            </div>
            <p style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 14, lineHeight: 1.7, color: '#1a0e04', margin: 0, letterSpacing: '0.01em',
            }}>{cultureFact.funFact}</p>
          </motion.div>
        </div>

        {/* ── Continue button — dark wood bar ── */}
        <div style={{ padding: '8px 16px 14px', borderTop: '2px double rgba(30,14,2,0.4)' }}>
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.02, filter: 'brightness(1.12)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '12px 28px',
              borderRadius: 2,
              background: 'linear-gradient(180deg, #3b1d07 0%, #251005 100%)',
              color: '#e8d5a0',
              border: '1px solid #b8860b',
              boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700, fontSize: 17, letterSpacing: '0.14em',
            }}
          >
            {isLast
              ? <><Trophy style={{ width: 14, height: 14 }} />FINAL REPORT</>
              : <><ChevronRight style={{ width: 14, height: 14 }} />NEXT CASE</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Suspect Briefing Modal ───────────────────────────────────────────────────

function SuspectBriefing({ suspect, onBegin, onBack }: {
  suspect: { alias: string; height: string; build: string; hair: string; method: string; lastSeen: string };
  onBegin: () => void;
  onBack: () => void;
}) {
  const fields: [string, string][] = [
    ["ALIAS",      suspect.alias],
    ["HEIGHT",     suspect.height],
    ["BUILD",      suspect.build],
    ["HAIR",       suspect.hair],
    ["METHOD",     suspect.method],
    ["LAST SEEN",  suspect.lastSeen],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 4000,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#f0e8d8',
        border: '1px solid rgba(80,40,10,0.4)',
        borderRadius: 2,
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        fontFamily: "'Courier New', Courier, monospace",
      }}>
        {/* Header bar */}
        <div style={{
          background: '#2a1a06',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 16, letterSpacing: '0.28em', color: 'rgba(220,185,100,0.85)', fontWeight: 700 }}>
            INTERPOL — SUSPECT FILE
          </span>
          <span style={{ fontSize: 13, color: 'rgba(220,185,100,0.4)', letterSpacing: '0.15em' }}>
            EYES ONLY
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px 14px', position: 'relative' }}>
          {/* CLASSIFIED stamp */}
          <div style={{
            position: 'absolute', top: 18, right: 16,
            transform: 'rotate(6deg)',
            border: '2.5px solid rgba(160,20,20,0.75)',
            borderRadius: 2,
            padding: '3px 9px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 14, fontWeight: 900, letterSpacing: '0.2em',
            color: 'rgba(160,20,20,0.75)',
            background: 'rgba(160,20,20,0.04)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            CLASSIFIED
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            {fields.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
                  color: 'rgba(40,20,5,0.55)', minWidth: 88, flexShrink: 0,
                }}>
                  {label}:
                </span>
                <span style={{
                  fontSize: 14, color: '#1a0e04', letterSpacing: '0.03em', lineHeight: 1.45,
                }}>
                  {value}
                </span>
              </div>
            ))}
            {/* Threat row */}
            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
              <span style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
                color: 'rgba(40,20,5,0.55)', minWidth: 88, flexShrink: 0,
              }}>
                THREAT:
              </span>
              <span style={{ fontSize: 14, color: '#1a0e04', letterSpacing: '0.1em' }}>
                ■■■■■■■■ <span style={{ fontSize: 16, fontWeight: 800, color: '#8b1a0a', letterSpacing: '0.12em' }}>CRITICAL</span>
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(40,20,5,0.2)', marginBottom: 12 }} />

          {/* Mission note */}
          <p style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 14, color: 'rgba(40,20,5,0.6)', lineHeight: 1.7, margin: '0 0 16px',
          }}>
            Your mission: track this suspect's last known location. Study the evidence carefully.
          </p>

          {/* Timer note */}
          <div style={{
            textAlign: 'center', marginBottom: 12,
            fontSize: 13, color: 'rgba(40,20,5,0.38)',
            fontFamily: "'Courier New', Courier, monospace",
            letterSpacing: '0.1em',
          }}>
            Timer begins when you start
          </div>

          {/* Bottom action row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onBack}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid rgba(138,106,74,0.4)',
                color: '#8a6a4a',
                fontFamily: "'Oswald', sans-serif",
                fontSize: 15, fontWeight: 600, letterSpacing: '0.1em',
                cursor: 'pointer', borderRadius: 2, flexShrink: 0,
              }}
            >
              ← ABORT MISSION
            </button>
            <motion.button
              onClick={onBegin}
              whileHover={{ scale: 1.02, filter: 'brightness(1.12)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: '12px 28px',
                background: '#5a1a08', color: '#f0e8d4',
                border: '1px solid rgba(100,40,10,0.5)',
                borderRadius: 2,
                fontFamily: "'Oswald', sans-serif",
                fontSize: 17, fontWeight: 700, letterSpacing: '0.15em',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
              }}
            >
              ▶ BEGIN CHASE
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ThiefDetectiveGame() {
  const [gameState, setGameState] = useState<"welcome" | "howtoplay" | "difficulty" | "intro" | "playing" | "result">("welcome");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [revealedClues, setRevealedClues] = useState<number[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [results, setResults] = useState<LevelResult[]>([]);
  const [showCultureCard, setShowCultureCard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");
  const [shuffledLevels, setShuffledLevels] = useState<Level[]>([]);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [showSuspectBriefing, setShowSuspectBriefing] = useState(false);

  // Best scores per difficulty stored in localStorage
  const getBestScore = (d: Difficulty) =>
    parseInt(localStorage.getItem(`phantom_best_${d}`) ?? '0');
  const saveBestScore = (d: Difficulty, s: number) => {
    if (s > getBestScore(d)) localStorage.setItem(`phantom_best_${d}`, String(s));
  };

  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  const playingLevels = shuffledLevels.length > 0
    ? shuffledLevels
    : LEVELS.filter(l => l.difficulty === selectedDifficulty).slice(0, 3);
  const level = playingLevels[currentLevel];
  const diff = selectedDifficulty;

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);

  const handleTimeUp = useCallback(() => {
    if (answeredRef.current) return;
    setAnswered(true);
    answeredRef.current = true;
    setIsCorrect(false);
    setEarnedPoints(0);
    playSoundEffect("wrong");
    setResults(prev => [...prev, {
      levelIndex: currentLevel,
      country: level.country,
      selectedEnglish: null,
      correct: false,
      points: 0,
      cluesUsed: revealedClues.length,
      difficulty: level.difficulty,
      timedOut: true,
    }]);
  }, [currentLevel, level, revealedClues]);

  const handleTimeUpRef = useRef(handleTimeUp);
  handleTimeUpRef.current = handleTimeUp;

  useEffect(() => {
    if (showSuspectBriefing) return;
    if (gameState !== "playing") return;
    const duration = TIMER_DURATION[selectedDifficulty];
    setTimeLeft(duration);
    answeredRef.current = false;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (answeredRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => handleTimeUpRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentLevel, gameState, showSuspectBriefing]);

  // Stop timer when answered
  useEffect(() => {
    if (answered && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [answered]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const beginGame = (difficulty: Difficulty) => {
    (document.activeElement as HTMLElement)?.blur();
    setSelectedDifficulty(difficulty);
    // Randomly pick 3 levels from the pool for this difficulty
    const pool = LEVELS.filter(l => l.difficulty === difficulty);
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    setShuffledLevels(picked);
    setGameState("intro");
  };

  const startGame = () => {
    playSoundEffect("start");
    // Blur any focused element to prevent keyboard carry-over triggering reveal button
    (document.activeElement as HTMLElement)?.blur();
    setGameState("playing");
    setCurrentLevel(0);
    setScore(0);
    scoreRef.current = 0;
    setRevealedClues([]);
    setSelectedCountry(null);
    setAnswered(false);
    answeredRef.current = false;
    setIsCorrect(false);
    setEarnedPoints(0);
    setResults([]);
    setShowCultureCard(false);
    setShowSuspectBriefing(true);
  };

  const maxClues = DIFFICULTY_CONFIG[diff].maxClues;

  const revealNextClue = () => {
    if (revealedClues.length < maxClues && !answered) {
      playSoundEffect("clue");
      setRevealedClues(prev => [...prev, prev.length]);
    }
  };

  const handleCountryClick = (name: string) => {
    if (answered) return;
    playSoundEffect("click");
    setSelectedCountry(name);
  };

  const handleSubmit = () => {
    if (!selectedCountry || answered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = selectedCountry === level.mapCountry;
    const pts = correct ? calcPoints(revealedClues.length) : 0;

    setAnswered(true);
    answeredRef.current = true;
    setIsCorrect(correct);
    setEarnedPoints(pts);
    scoreRef.current += pts;
    setScore(scoreRef.current);

    if (correct) {
      playSoundEffect("correct");
      setTimeout(fireSmallConfetti, 200);
    } else {
      playSoundEffect("wrong");
    }

    setResults(prev => [...prev, {
      levelIndex: currentLevel,
      country: level.country,
      selectedEnglish: selectedCountry,
      correct,
      points: pts,
      cluesUsed: revealedClues.length,
      difficulty: level.difficulty,
    }]);
  };

  const openCultureCard = () => {
    setShowCultureCard(true);
  };

  const nextLevel = () => {
    if (showCultureCard) setShowCultureCard(false);
    const nextIdx = currentLevel + 1;

    if (nextIdx >= 3) {
      playSoundEffect("complete");
      setTimeout(fireConfetti, 100);
      saveBestScore(selectedDifficulty, scoreRef.current);
      setGameState("result");
      return;
    }

    advanceToLevel(nextIdx);
  };

  const advanceToLevel = (idx: number) => {
    setCurrentLevel(idx);
    setRevealedClues([]);
    setSelectedCountry(null);
    setAnswered(false);
    answeredRef.current = false;
    setIsCorrect(false);
    setEarnedPoints(0);
    setShowSuspectBriefing(true);
  };

  const timerTotal = TIMER_DURATION[selectedDifficulty];
  const isUrgent = timeLeft <= 10 && !answered;
  const isCritical = timeLeft <= 5 && !answered;

  // ── Shared noir background ────────────────────────────────────────────────
  const NoirBg = () => (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: '#1a0e04',
        backgroundImage: 'url(https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.22) saturate(0.35) sepia(0.5)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.009) 2px, rgba(255,255,255,0.009) 3px)',
      }} />
    </>
  );

  // ── Welcome Screen — Evidence Board ─────────────────────────────────────
  if (gameState === "welcome") {
    const SIGHTINGS = [
      { flag: '🇦🇷', loc: 'BUENOS AIRES', time: '1h AGO',  hot: true  },
      { flag: '🇰🇷', loc: 'SEOUL',        time: '3h AGO',  hot: true  },
      { flag: '🇩🇪', loc: 'BERLIN',       time: '7h AGO',  hot: false },
      { flag: '🇪🇸', loc: 'BARCELONA',    time: '11h AGO', hot: false },
      { flag: '🇿🇦', loc: 'CAPE TOWN',    time: '15h AGO', hot: false },
      { flag: '🇨🇳', loc: 'SHANGHAI',     time: '18h AGO', hot: false },
      { flag: '🇺🇸', loc: 'NEW YORK',     time: '21h AGO', hot: false },
      { flag: '🇨🇱', loc: 'SANTIAGO',     time: '26h AGO', hot: false },
    ];
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: '#1a0e04',
          backgroundImage: 'url(https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          filter: 'brightness(0.18) saturate(0.3) sepia(0.4)',
        }} />
        {/* Left-heavy vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(4,2,1,0.96) 0%, rgba(4,2,1,0.7) 45%, rgba(4,2,1,0.3) 100%)' }} />
        {/* Scanlines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.007) 2px, rgba(255,255,255,0.007) 3px)' }} />

        {/* ── Layout ── */}
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>

          {/* ══ LEFT — WANTED poster (physical paper) ══ */}
          <div style={{ width: '42%', minWidth: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 48 }}>
            <motion.div
              initial={{ opacity: 0, rotate: -4, y: 20 }}
              animate={{ opacity: 1, rotate: -2, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                width: 260,
                background: '#f0e6cc',
                padding: '22px 20px 26px',
                boxShadow: '6px 12px 40px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)',
                position: 'relative',
                transform: 'rotate(-2deg)',
              }}
            >
              {/* Tape strip top */}
              <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 60, height: 20, background: 'rgba(255,240,180,0.55)', border: '1px solid rgba(200,180,100,0.4)', borderRadius: 2 }} />

              {/* WANTED header */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, letterSpacing: '0.25em', color: '#3a2010', marginBottom: 4 }}>
                  INTERPOL — PRIORITY NOTICE
                </div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif", fontSize: 42, fontWeight: 900,
                  letterSpacing: '0.12em', color: '#8b1a0a', lineHeight: 1,
                  textShadow: '1px 1px 0 rgba(0,0,0,0.15)',
                }}>
                  WANTED
                </div>
              </div>

              {/* Photo */}
              <div style={{
                width: '100%', height: 180,
                background: 'linear-gradient(160deg, #d4c4a0 0%, #c8b890 100%)',
                border: '3px solid #a09070',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, fontSize: 80, position: 'relative',
                overflow: 'hidden',
              }}>
                🕵️
                {/* Photo corner marks */}
                {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
                  <div key={v+h} style={{
                    position: 'absolute', [v]: 4, [h]: 4, width: 14, height: 14,
                    borderTop: v === 'top' ? '2px solid #5a4020' : 'none',
                    borderBottom: v === 'bottom' ? '2px solid #5a4020' : 'none',
                    borderLeft: h === 'left' ? '2px solid #5a4020' : 'none',
                    borderRight: h === 'right' ? '2px solid #5a4020' : 'none',
                  }} />
                ))}
              </div>

              {/* Name block */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 23, fontWeight: 700, letterSpacing: '0.15em', color: '#1a0c00', lineHeight: 1 }}>
                  "THE PHANTOM"
                </div>
                <div style={{ fontSize: 13, letterSpacing: '0.22em', color: '#6a5040', fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
                  ALIAS UNKNOWN · SEX UNKNOWN
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #b09870', margin: '10px 0' }} />

              {/* Details */}
              <div style={{ fontSize: 13, color: '#4a3020', fontFamily: "'Space Mono', monospace", lineHeight: 1.9, letterSpacing: '0.05em' }}>
                <div>NATIONALITY:  UNKNOWN</div>
                <div>LAST SEEN:    MULTIPLE COUNTRIES</div>
                <div>SPECIALITY:   THEFT · EVASION</div>
              </div>

              {/* ARMED & DANGEROUS stamp */}
              <div style={{
                position: 'absolute', bottom: 22, right: -8,
                transform: 'rotate(12deg)',
                border: '2px solid rgba(140,20,10,0.7)',
                padding: '3px 8px',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.2em',
                color: 'rgba(140,20,10,0.8)',
                fontFamily: "'Oswald', sans-serif",
                background: 'rgba(255,255,255,0.1)',
              }}>
                TOP PRIORITY
              </div>
            </motion.div>
          </div>

          {/* ══ RIGHT — Mission brief ══ */}
          <div style={{ flex: 1, padding: '0 52px 0 40px', display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* INTERPOL badge line */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}
            >
              <div style={{ height: 1, width: 28, background: 'rgba(212,180,120,0.35)' }} />
              <span style={{ fontSize: 13, letterSpacing: '0.38em', color: 'rgba(212,180,120,0.45)', fontFamily: "'Space Mono', monospace" }}>INTERPOL · CASE FILE OPEN</span>
            </motion.div>

            {/* Title */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <div style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 0.95, letterSpacing: '0.04em', color: '#fff', fontFamily: "'Oswald', sans-serif", marginBottom: 6 }}>
                GLOBAL
              </div>
              <div style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 0.95, letterSpacing: '0.04em', color: 'rgba(212,180,120,0.85)', fontFamily: "'Oswald', sans-serif", marginBottom: 22 }}>
                CHASE
              </div>
            </motion.div>

            {/* Mission text */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              style={{ marginBottom: 28, maxWidth: 380 }}
            >
              <p style={{ margin: '0 0 8px', fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7 }}>
                The Phantom has struck again — six countries, no witnesses.
                Study the crime scene photos and <span style={{ color: 'rgba(212,180,120,0.9)', fontWeight: 600 }}>mark the country on the map</span> before they disappear.
              </p>
            </motion.div>

            {/* Live sightings — vertical scroll ticker */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ marginBottom: 30 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e04030', boxShadow: '0 0 8px #e04030', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 13, letterSpacing: '0.3em', color: 'rgba(212,180,120,0.5)', fontFamily: "'Space Mono', monospace" }}>PHANTOM SIGHTINGS — LIVE FEED</span>
              </div>
              {/* Ticker window */}
              <div style={{ height: 132, overflow: 'hidden', position: 'relative' }}>
                {/* Fade top/bottom */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to bottom, rgba(4,2,1,0.95), transparent)', zIndex: 1, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to top, rgba(4,2,1,0.95), transparent)', zIndex: 1, pointerEvents: 'none' }} />
                <motion.div
                  animate={{ y: ['0%', '-50%'] }}
                  transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  {[...SIGHTINGS, ...SIGHTINGS].map(({ flag, loc, time, hot }, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px', background: hot ? 'rgba(220,60,30,0.07)' : 'rgba(255,255,255,0.025)', borderLeft: `2px solid ${hot ? 'rgba(220,60,30,0.5)' : 'rgba(255,255,255,0.06)'}` }}>
                      <span style={{ fontSize: 16 }}>{flag}</span>
                      <span style={{ fontSize: 13, color: hot ? 'rgba(255,200,180,0.85)' : 'rgba(212,180,120,0.5)', letterSpacing: '0.08em', flex: 1, fontFamily: "'Space Mono', monospace" }}>{loc}</span>
                      <span style={{ fontSize: 13, color: hot ? 'rgba(220,100,80,0.7)' : 'rgba(255,255,255,0.18)', fontFamily: "'Space Mono', monospace" }}>{time}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
              <motion.button
                whileHover={{ scale: 1.03, background: 'rgba(212,180,120,0.16)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setGameState("howtoplay")}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(212,180,120,0.09)',
                  border: '1px solid rgba(212,180,120,0.45)',
                  borderLeft: '3px solid rgba(212,180,120,0.7)',
                  color: 'rgba(212,180,120,0.95)',
                  fontWeight: 700, letterSpacing: '0.2em', fontSize: 17,
                  padding: '14px 28px', borderRadius: '0 3px 3px 0',
                  cursor: 'pointer', fontFamily: "'Oswald', sans-serif",
                  boxShadow: '0 0 28px rgba(212,180,120,0.06)',
                }}
              >
                <span style={{ fontSize: 20 }}>▶</span>
                ACCEPT MISSION
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ── How To Play Screen — Typewritten briefing document ──────────────────
  if (gameState === "howtoplay") {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <NoirBg />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(4,2,1,0.88) 0%, rgba(4,2,1,0.55) 50%, rgba(4,2,1,0.2) 100%)' }} />

        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, rotate: 1.5, y: 18 }}
            animate={{ opacity: 1, rotate: 0.6, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            style={{
              width: 540,
              background: '#ede0c4',
              boxShadow: '8px 16px 60px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4)',
              position: 'relative',
              color: '#1e1206',
              overflow: 'hidden',
            }}
          >
            {/* Red classification bar top */}
            <div style={{ height: 10, background: '#8b1a0a', width: '100%' }} />

            <div style={{ padding: '28px 38px 0' }}>
              {/* CLASSIFIED stamp */}
              <div style={{
                position: 'absolute', top: 28, right: 24,
                transform: 'rotate(12deg)',
                border: '3px solid rgba(139,26,10,0.7)',
                padding: '4px 10px',
                fontFamily: "'Oswald', sans-serif",
                fontSize: 18, fontWeight: 900, letterSpacing: '0.22em',
                color: 'rgba(139,26,10,0.72)',
              }}>CLASSIFIED</div>

              {/* Letterhead */}
              <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '2px solid #9a8060' }}>
                <div style={{ fontSize: 13, letterSpacing: '0.3em', color: '#3a2510', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                  INTERPOL · FIELD OPERATIONS DIVISION
                </div>
                <div style={{ fontSize: 13, letterSpacing: '0.18em', color: '#7a6040', fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
                  DOC REF: OP-PHANTOM-7 · EYES ONLY
                </div>
              </div>

              {/* TO / FROM / RE — high contrast */}
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, lineHeight: 1.9, marginBottom: 18 }}>
                {[
                  { label: 'TO  :', value: 'FIELD DETECTIVE, UNIT 7' },
                  { label: 'FROM:', value: 'DIRECTOR D. HAYES' },
                  { label: 'RE  :', value: 'OPERATION GLOBAL CHASE' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 14 }}>
                    <span style={{ color: '#8b1a0a', fontWeight: 700, flexShrink: 0 }}>{label}</span>
                    <span style={{ color: '#1a0c00', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #b09870', marginBottom: 16 }} />

              {/* Body paragraph */}
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, lineHeight: 2, color: '#2a1a0a', marginBottom: 16 }}>
                You are hereby assigned to locate THE PHANTOM. Crime scene
                photographs from each heist have been loaded into your case file.
              </div>

              {/* Rules — prominent header */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '0.2em', color: '#8b1a0a', marginBottom: 8, borderBottom: '1px solid #c0a080', paddingBottom: 4 }}>
                  RULES OF ENGAGEMENT
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, lineHeight: 2.2, color: '#1a0800' }}>
                  <div>— Each case: <strong>30–60 second window</strong> before the trail goes cold.</div>
                  <div>— Intel clues available, but each one <strong>costs points.</strong></div>
                  <div>— <strong>One map click only.</strong> No second chances.</div>
                  <div>— Score <strong>60+ pts</strong> per session to unlock harder cases.</div>
                </div>
              </div>

              {/* Redacted */}
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, lineHeight: 2, color: '#2a1a0a', marginBottom: 20 }}>
                <span style={{ fontSize: 16, fontFamily: 'monospace', color: '#8b0000', background: 'rgba(0,0,0,0.15)', padding: '2px 12px', border: '1px solid rgba(139,0,0,0.4)', borderRadius: 2, letterSpacing: '0.15em', userSelect: 'none' }}>[REDACTED]</span>
                {' '}has been authorized to assist. Do not fail.
              </div>

              {/* Signature + stamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1a0800', marginBottom: 2 }}>D. Hayes</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#5a4030', lineHeight: 1.8 }}>
                    <div>DIRECTOR, INTERPOL</div>
                    <div>FIELD OPERATIONS</div>
                  </div>
                </div>
                <div style={{ border: '2px solid rgba(20,100,30,0.65)', borderRadius: '50%', width: 70, height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-8deg)', color: 'rgba(20,100,30,0.7)', fontFamily: "'Oswald', sans-serif", textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em' }}>APPROVED</div>
                  <div style={{ fontSize: 13, letterSpacing: '0.08em' }}>UNIT 7</div>
                </div>
              </div>
            </div>

            {/* Nav buttons — dark strip at bottom of paper */}
            <div style={{ background: '#2a1a06', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(200,168,130,0.3)' }}>
              <motion.button whileHover={{ opacity: 0.85 }}
                onClick={() => setGameState("welcome")}
                style={{ color: '#c8a882', background: 'transparent', border: '1px solid rgba(200,168,130,0.4)', padding: '10px 24px', fontFamily: "'Oswald', sans-serif", fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 4 }}
              >← BACK</motion.button>
              <motion.button whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.98 }}
                onClick={() => setGameState("difficulty")}
                style={{ background: '#5a1a08', color: '#f0e8d4', border: 'none', padding: '12px 28px', fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 4 }}
              >
                SELECT DIFFICULTY →
              </motion.button>
            </div>

            {/* Red classification bar bottom */}
            <div style={{ height: 10, background: '#8b1a0a', width: '100%' }} />
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Difficulty Select Screen — Physical case folders ─────────────────────
  if (gameState === "difficulty") {
    const UNLOCK_FROM2: Partial<Record<Difficulty, Difficulty>> = { medium: 'easy', hard: 'medium' };
    const FOLDERS: { d: Difficulty; label: string; tab: string; stamp: string; timer: string; clues: string; desc: string; paperBg: string; tabColor: string }[] = [
      { d: 'easy',   label: 'ROOKIE CHASE',     tab: 'LEVEL I',    stamp: 'OPEN',       timer: '60 SEC', clues: '3 CLUES', desc: 'Iconic landmarks. Build your detective eye.', paperBg: '#ede0c4', tabColor: '#5a7a3a' },
      { d: 'medium', label: 'SENIOR AGENT',     tab: 'LEVEL II',   stamp: 'RESTRICTED', timer: '45 SEC', clues: '2 CLUES', desc: 'Trickier locations. The Phantom moves faster.', paperBg: '#e8d8b8', tabColor: '#9a6020' },
      { d: 'hard',   label: 'ELITE OPERATION',  tab: 'LEVEL III',  stamp: 'CLASSIFIED', timer: '30 SEC', clues: '1 CLUE',  desc: 'Obscure destinations. One clue. No mercy.', paperBg: '#e2cca8', tabColor: '#8b1a0a' },
    ];
    const ROTATIONS = [-1.5, 0.3, 1.8];
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <NoirBg />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(4,2,1,0.88) 0%, rgba(4,2,1,0.55) 50%, rgba(4,2,1,0.2) 100%)' }} />

        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ marginBottom: 28, textAlign: 'center' }}
          >
            <div style={{ fontSize: 13, letterSpacing: '0.38em', color: 'rgba(212,180,120,0.38)', fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>
              ◈ INTERPOL · CHOOSE YOUR OPERATION
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '0.12em', color: '#fff', fontFamily: "'Oswald', sans-serif" }}>
              SELECT CASE FILE
            </div>
          </motion.div>

          {/* Three folders */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {FOLDERS.map(({ d, label, tab, stamp, timer, clues, desc, paperBg, tabColor }, di) => {
              const unlockFrom = UNLOCK_FROM2[d];
              const fromBest = unlockFrom ? getBestScore(unlockFrom) : Infinity;
              const locked = !!unlockFrom && fromBest < 60;
              const best = getBestScore(d);
              return (
                <motion.div key={d}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + di * 0.12, ease: 'easeOut' }}
                  whileHover={!locked ? { y: -6, rotate: 0, transition: { duration: 0.2 } } : {}}
                  onClick={() => !locked && beginGame(d)}
                  style={{
                    width: 200,
                    transform: `rotate(${ROTATIONS[di]}deg)`,
                    cursor: locked ? 'default' : 'pointer',
                    filter: locked ? 'brightness(0.45) saturate(0.3)' : 'none',
                    transformOrigin: 'bottom center',
                    userSelect: 'none',
                  }}
                >
                  {/* Folder tab */}
                  <div style={{ height: 28, background: tabColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginRight: 60, borderRadius: '4px 4px 0 0' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.9)', fontFamily: "'Space Mono', monospace" }}>{tab}</span>
                  </div>

                  {/* Folder body */}
                  <div style={{ background: paperBg, padding: '18px 16px 20px', boxShadow: '4px 8px 32px rgba(0,0,0,0.65)', position: 'relative', minHeight: 230 }}>
                    {/* Stamp */}
                    <div style={{
                      position: 'absolute', top: 12, right: 10,
                      transform: 'rotate(10deg)',
                      border: `2px solid ${tabColor}aa`,
                      padding: '2px 7px',
                      fontSize: 13, fontWeight: 700, letterSpacing: '0.18em',
                      color: `${tabColor}cc`,
                      fontFamily: "'Oswald', sans-serif",
                    }}>{locked ? 'LOCKED' : stamp}</div>

                    {/* Case label */}
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#5a4020', letterSpacing: '0.2em', marginBottom: 8 }}>
                      CASE FILE OP-{di + 1}
                    </div>

                    {/* Title */}
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: '#1a0800', lineHeight: 1.1, marginBottom: 12 }}>
                      {label}
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #b09060', marginBottom: 12 }} />

                    {/* Stats typed out */}
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#3a2010', lineHeight: 2 }}>
                      <div>TIME:   <strong>{timer}</strong></div>
                      <div>INTEL:  <strong>{clues}</strong></div>
                    </div>

                    {/* Desc */}
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#5a4030', lineHeight: 1.7, marginTop: 10, borderTop: '1px dashed #c0a070', paddingTop: 10 }}>
                      {locked && unlockFrom ? `Score 60+ on ${unlockFrom.toUpperCase()} to unlock` : desc}
                    </div>

                    {/* Best score */}
                    {!locked && (
                      <div style={{ position: 'absolute', bottom: 14, right: 14, textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 23, fontWeight: 700, color: tabColor }}>{best > 0 ? best : '—'}</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#7a6040' }}>/90</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Back button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ marginTop: 36 }}
          >
            <button onClick={() => setGameState("howtoplay")}
              style={{ background: 'transparent', border: '1px solid rgba(212,180,120,0.2)', color: 'rgba(212,180,120,0.4)', fontFamily: "'Space Mono', monospace", fontSize: 15, letterSpacing: '0.2em', padding: '10px 20px', borderRadius: 2, cursor: 'pointer' }}
            >← BACK</button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Cinematic Intro ─────────────────────────────────────────────────────────
  if (gameState === "intro") {
    return <IntroSequence onComplete={startGame} difficulty={selectedDifficulty} />;
  }

  // ── Final Result Screen ─────────────────────────────────────────────────────
  if (gameState === "result") {
    const maxScore = 3 * 30;
    const correctCount = results.filter(r => r.correct).length;
    const timedOutCount = results.filter(r => r.timedOut).length;

    const NEXT_DIFF: Partial<Record<Difficulty, Difficulty>> = { easy: "medium", medium: "hard" };
    const DIFF_LABELS: Record<Difficulty, string> = { easy: "Rookie Chase", medium: "Senior Agent", hard: "Elite Operation" };
    const nextDiff = NEXT_DIFF[selectedDifficulty];
    const nextUnlocked = nextDiff && score >= 60; // need 60/90 to unlock next

    // ── Achievements ──
    const allCluesZero = results.every(r => r.cluesUsed === 0);
    const noTimeouts = timedOutCount === 0;
    const isGrandMaster = getBestScore('easy') >= 60 && getBestScore('medium') >= 60 && getBestScore('hard') >= 60;

    const ACHIEVEMENTS: { icon: string; title: string; desc: string; earned: boolean }[] = [
      { icon: '🏆', title: 'Perfect Capture',   desc: 'All 3 suspects caught',                earned: correctCount === 3 },
      { icon: '💎', title: 'Flawless Score',     desc: 'Maximum 90 pts achieved',              earned: score === maxScore },
      { icon: '🧠', title: 'No Hints Needed',    desc: 'Solved all cases without clues',       earned: allCluesZero },
      { icon: '⚡', title: 'Beat the Clock',     desc: 'No time-outs this run',                earned: noTimeouts },
      { icon: '🎖', title: 'Rookie Graduate',    desc: 'Passed Rookie Chase (60+ pts)',         earned: getBestScore('easy') >= 60 },
      { icon: '🥈', title: 'Senior Agent',       desc: 'Cleared Senior Agent tier',            earned: getBestScore('medium') >= 60 },
      { icon: '🥇', title: 'Elite Detective',    desc: 'Conquered Elite Operation',            earned: getBestScore('hard') >= 60 },
      { icon: '👑', title: 'Grand Master',       desc: 'All three difficulty tiers defeated',  earned: isGrandMaster },
    ];

    return (
      <div style={{
        minHeight: '100vh', overflowY: 'auto',
        backgroundColor: '#c4b89e',
        backgroundImage: [
          'radial-gradient(ellipse at 10% 90%, rgba(80,50,15,0.12) 0%, transparent 40%)',
          'radial-gradient(ellipse at 90% 10%, rgba(60,38,10,0.09) 0%, transparent 38%)',
          'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(40,25,8,0.018) 3px, rgba(40,25,8,0.018) 4px)',
        ].join(','),
        padding: '0 0 40px',
      }}>

        {/* ── Masthead ── */}
        <div style={{ background: 'rgba(10,6,2,0.97)', borderBottom: '3px solid rgba(160,115,35,0.5)', padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(200,169,110,0.6)', fontFamily: "'Courier New', monospace", letterSpacing: '0.25em', marginBottom: 2 }}>INTERPOL · PHANTOM UNIT</div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#e8dcc8', letterSpacing: '0.12em' }}>GLOBAL CHASE</div>
          </div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: 'rgba(200,169,110,0.5)', letterSpacing: '0.15em', textAlign: 'right' }}>
            <div>CASE FILE — CLOSED</div>
            <div>{DIFF_LABELS[selectedDifficulty].toUpperCase()}</div>
          </div>
        </div>

        <div style={{ maxWidth: 660, margin: '0 auto', padding: '28px 20px 0' }}>

          {/* ── Case Closing Report — physical document ── */}
          {(() => {
            const totalCluesUsed = results.reduce((sum, r) => sum + r.cluesUsed, 0);
            const ESCAPE_CITIES = ['Zurich', 'Buenos Aires', 'Istanbul', 'Seoul', 'Cape Town', 'Shanghai'];
            const escapeCity = ESCAPE_CITIES[Math.floor(Math.random() * ESCAPE_CITIES.length)];
            const RANK = score === maxScore ? { title: 'PHANTOM HUNTER',  color: '#6b430f' }
              : score >= 75 ? { title: 'CHIEF INSPECTOR',   color: '#4a6a20' }
              : score >= 55 ? { title: 'SENIOR INSPECTOR',  color: '#3a5a18' }
              : score >= 30 ? { title: 'FIELD DETECTIVE',   color: '#5a5a3a' }
              :               { title: 'TRAINEE',           color: '#7a1a0a' };
            const VERDICT = correctCount === 3
              ? `All three Phantom operatives apprehended and transferred to INTERPOL custody. The international heist ring has been dismantled. Exemplary detective work.`
              : correctCount === 2
              ? `Two of three suspects captured. One operative evaded custody and was last tracked fleeing toward ${escapeCity}. The Phantom's network remains partially active.`
              : correctCount === 1
              ? `One suspect brought in. Two operatives remain at large. Last signal traced toward ${escapeCity} — the trail may already be cold.`
              : `All three suspects evaded capture. The Phantom has gone dark. No leads, no witnesses. Case escalated to the Director's office.`;
            const stampColor = correctCount === 3 ? '#2a6a10' : correctCount >= 2 ? '#8a5a08' : '#8a1a0a';
            const headline = correctCount === 3 ? 'SUSPECTS APPREHENDED' : correctCount === 2 ? 'PARTIAL CAPTURE' : correctCount === 1 ? 'SUSPECT ESCAPED' : 'PHANTOM AT LARGE';
            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                style={{ marginBottom: 22 }}
              >
                {/* Eyebrow */}
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: 'rgba(40,25,8,0.45)', letterSpacing: '0.25em', marginBottom: 6 }}>
                  DETECTIVE SCORECARD · {DIFF_LABELS[selectedDifficulty].toUpperCase()}
                </div>

                {/* Big headline */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
                  style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 5vw, 42px)', color: '#1a0800', letterSpacing: '0.04em', lineHeight: 1, marginBottom: 16 }}
                >
                  {headline}
                </motion.div>

                {/* Score + Rank row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'stretch' }}>
                  {/* Score box */}
                  <div style={{ flex: 1, background: '#ede0c4', boxShadow: '2px 4px 14px rgba(0,0,0,0.22)', padding: '16px 20px', borderTop: `4px solid ${stampColor}` }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 16, fontWeight: 700, color: 'rgba(40,25,8,0.45)', letterSpacing: '0.2em', marginBottom: 6 }}>FINAL SCORE</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 900, fontSize: 44, color: '#1a0800', lineHeight: 1 }}>{score}</span>
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: 14, color: 'rgba(40,25,8,0.5)' }}>/ {maxScore} pts</span>
                    </div>
                    {/* Stat row */}
                    <div style={{ display: 'flex', gap: 18, marginTop: 10, fontFamily: "'Courier New', monospace", fontSize: 16 }}>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#1a0800' }}>{correctCount}/3</span>
                        <span style={{ color: 'rgba(40,25,8,0.45)', marginLeft: 4, fontWeight: 600 }}>caught</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#1a0800' }}>{totalCluesUsed}</span>
                        <span style={{ color: 'rgba(40,25,8,0.45)', marginLeft: 4, fontWeight: 600 }}>clues used</span>
                      </div>
                    </div>
                  </div>

                  {/* Rank badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 18 }}
                    style={{ background: '#ede0c4', boxShadow: '2px 4px 14px rgba(0,0,0,0.22)', padding: '16px 18px', borderTop: `4px solid ${RANK.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 110 }}
                  >
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 16, fontWeight: 700, color: 'rgba(40,25,8,0.45)', letterSpacing: '0.2em' }}>RANK</div>
                    <div style={{ border: `2px solid ${RANK.color}`, borderRadius: '50%', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12 }}>
                      <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', color: RANK.color, lineHeight: 1.3 }}>{RANK.title}</div>
                    </div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: 'rgba(40,25,8,0.4)', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.4 }}>{RANK.title === 'PHANTOM HUNTER' ? <>Elite status<br/>achieved</> : <>Further training<br/>required</>}</div>
                  </motion.div>
                </div>

                {/* Verdict */}
                <div style={{ background: '#ede0c4', boxShadow: '2px 4px 14px rgba(0,0,0,0.18)', padding: '14px 18px', borderLeft: `4px solid ${stampColor}` }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8b1a0a', letterSpacing: '0.22em', fontWeight: 900, marginBottom: 8 }}>DIRECTOR'S VERDICT</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: '#2a1206', lineHeight: 1.8 }}>{VERDICT}</div>
                </div>
              </motion.div>
            );
          })()}

          {/* ── Case results ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, letterSpacing: '0.22em', color: '#3a1e06', marginBottom: 12, borderTop: '2px solid rgba(40,25,8,0.35)', paddingTop: 14, fontWeight: 900 }}>
              — CASE LOG —
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {results.map((r, ri) => {
                const isCorrect = r.correct;
                const isTimeout = r.timedOut;
                const stampText = isCorrect ? 'CASE\nCLOSED' : isTimeout ? 'TIME\nEXP.' : 'CASE\nOPEN';
                const stampColor = isCorrect ? '#1a5a08' : isTimeout ? '#7a5010' : '#8b1a0a';
                const paperBg = isCorrect ? '#dde8cc' : isTimeout ? '#e8dcc8' : '#ede0c4';
                const rotations = [-1.8, 0.6, 1.4];
                return (
                  <div key={ri} style={{
                    flex: 1,
                    background: paperBg,
                    boxShadow: '3px 5px 16px rgba(0,0,0,0.28)',
                    transform: `rotate(${rotations[ri]}deg)`,
                    padding: '14px 14px 16px',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {/* Rubber stamp top-right */}
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      fontFamily: "'Courier New', monospace", fontSize: 16, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1.4,
                      color: stampColor, border: `2px solid ${stampColor}`,
                      padding: '2px 5px', transform: 'rotate(8deg)',
                      opacity: 0.75, textAlign: 'center', whiteSpace: 'pre',
                    }}>{stampText}</div>

                    {/* Case number */}
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: 'rgba(100,70,30,0.5)', letterSpacing: '0.1em' }}>
                      CASE {String(ri + 1).padStart(2, '0')}
                    </div>

                    {/* Country — the focal point */}
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 900, fontSize: 25, color: '#1a0800', lineHeight: 1, paddingRight: 34 }}>
                      {r.country}
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px dashed rgba(0,0,0,0.18)' }} />

                    {/* Result note */}
                    <div style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(40,25,8,0.6)', lineHeight: 1.4 }}>
                      {isCorrect
                        ? <><strong style={{ fontStyle: 'normal', color: '#1a5a08' }}>+{r.points} pts</strong> — suspect apprehended</>
                        : isTimeout
                        ? 'Time expired — suspect fled'
                        : <>Wrong lead —<br />guessed <em>{getDisplayName(r.selectedEnglish || '')}</em></>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Next difficulty unlock ── */}
          {nextDiff && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} style={{ marginBottom: 20 }}>
              <div style={{
                background: '#ede0c4',
                borderTop: `3px solid ${nextUnlocked ? 'rgba(100,140,30,0.6)' : 'rgba(40,25,8,0.18)'}`,
                boxShadow: '2px 4px 12px rgba(0,0,0,0.2)',
                padding: '12px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
                opacity: nextUnlocked ? 1 : 0.7,
              }}>
                {/* Status marker */}
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 25, color: nextUnlocked ? '#3a6010' : 'rgba(40,25,8,0.3)', flexShrink: 0, lineHeight: 1 }}>
                  {nextUnlocked ? '▣' : '▢'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 13, letterSpacing: '0.2em', color: nextUnlocked ? '#4a6a10' : 'rgba(40,25,8,0.4)', marginBottom: 3 }}>
                    {nextUnlocked
                      ? `${({ medium: 'SENIOR AGENT', hard: 'ELITE OPERATION' } as Record<string,string>)[nextDiff]} — CLEARANCE GRANTED`
                      : `${({ medium: 'SENIOR AGENT', hard: 'ELITE OPERATION' } as Record<string,string>)[nextDiff]} — ACCESS DENIED`}
                  </div>
                  <div style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(40,25,8,0.58)' }}>
                    {nextUnlocked ? `Score ${score}/90 — next tier is now available.` : `Score 60+ pts to unlock. You got ${score}/90 — ${60 - score} more needed.`}
                  </div>
                </div>
                {nextUnlocked && (
                  <button
                    onClick={() => beginGame(nextDiff)}
                    style={{ padding: '12px 28px', background: '#2a1806', color: '#f0e8d4', border: '1px solid rgba(180,130,40,0.4)', fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '0.12em', cursor: 'pointer', flexShrink: 0 }}
                  >
                    NEXT TIER →
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Achievements ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, letterSpacing: '0.22em', color: '#3a1e06', marginBottom: 10, borderTop: '2px solid rgba(40,25,8,0.35)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
              <span>— COMMENDATIONS —</span>
              <span style={{ opacity: 0.55 }}>{ACHIEVEMENTS.filter(a => a.earned).length} / {ACHIEVEMENTS.length}</span>
            </div>

            {/* Grand Master — certificate banner */}
            {isGrandMaster && (
              <div style={{ background: '#f0e6c2', borderTop: '3px double rgba(160,110,15,0.6)', borderBottom: '3px double rgba(160,110,15,0.6)', padding: '7px 16px', marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '0.35em', color: '#7a4e08' }}>★ &nbsp; GRAND MASTER DETECTIVE &nbsp; ★</div>
                <div style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(40,25,8,0.6)', marginTop: 3 }}>Every tier conquered. The Phantom has nowhere left to hide.</div>
              </div>
            )}

            {/* Commendation stamps — paper background */}
            <div style={{ background: '#ede0c4', boxShadow: '2px 4px 14px rgba(0,0,0,0.22)', padding: '18px 18px 14px' }}>

              {/* All stamps — earned solid, unearned ghost */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {ACHIEVEMENTS.map((a, i) => {
                  const rots = [-2, 1.5, -1, 2.5, -0.5, 1, -1.8, 0.8];
                  return (
                    <motion.div
                      key={a.title}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i, type: 'spring', stiffness: 260, damping: 18 }}
                      style={{
                        border: a.earned ? '2px solid rgba(30,16,4,0.78)' : '1.5px dashed rgba(30,16,4,0.22)',
                        padding: '6px 12px',
                        transform: `rotate(${rots[i % rots.length]}deg)`,
                        display: 'inline-block',
                        opacity: a.earned ? 1 : 0.45,
                      }}
                    >
                      <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: '0.14em', color: a.earned ? '#1a0800' : 'rgba(40,25,8,0.5)' }}>{a.title.toUpperCase()}</div>
                      <div style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(40,25,8,0.5)', marginTop: 2 }}>{a.desc}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── Action buttons ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setGameState("difficulty")}
              style={{ flex: 1, padding: '10px 20px', background: 'rgba(40,25,8,0.08)', color: 'rgba(40,25,8,0.85)', border: '1.5px solid rgba(40,25,8,0.4)', fontFamily: "'Courier New', monospace", fontSize: 15, letterSpacing: '0.12em', cursor: 'pointer', borderRadius: 2 }}
            >
              ← SELECT DIFFICULTY
            </button>
            <button
              onClick={() => beginGame(selectedDifficulty)}
              style={{ flex: 2, padding: '12px 28px', background: '#2a1806', color: '#f0e8d4', border: '1px solid rgba(180,130,40,0.4)', fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              ↺ REPLAY
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Playing Screen ──────────────────────────────────────────────────────────
  return (
    <div className="detective-bg" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Urgency Alert Banner ── */}
      <AnimatePresence>
        {isUrgent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              width: '100%', textAlign: 'center', padding: '5px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: isCritical ? '#2a0a08' : '#1a1204',
              borderBottom: `2px solid ${isCritical ? 'rgba(180,30,20,0.8)' : 'rgba(160,100,10,0.7)'}`,
              zIndex: 1050,
            }}
          >
            <span style={{ fontSize: 13, letterSpacing: '0.25em', fontFamily: "'Courier New', monospace", color: isCritical ? '#c0201a' : '#b87a10', fontWeight: 900 }}>
              ▸ {isCritical ? `CRITICAL — PHANTOM ESCAPING — ${timeLeft}s` : `ALERT — SUSPECT MOVING — ${timeLeft}s REMAIN`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Header — dark wood ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 1100,
        background: 'linear-gradient(180deg, #3b1d07 0%, #251005 100%)',
        borderBottom: '3px solid #b8860b',
        boxShadow: '0 4px 18px rgba(0,0,0,0.55)',
      }}>
        {/* Main masthead row — left title / right score */}
        <div style={{ padding: '6px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Left: back + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setGameState("difficulty")}
              style={{ color: '#c8a882', fontSize: 16, background: 'none', border: '1px solid rgba(200,168,130,0.4)', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.1em', fontFamily: "'Courier New', Courier, monospace", fontWeight: 700, opacity: 0.8, whiteSpace: 'nowrap' }}
            >← FILES</button>
            <div style={{ width: 1, height: 26, background: 'rgba(200,168,76,0.3)', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, letterSpacing: '0.15em', fontSize: '1.15rem', color: '#e8d5a0', whiteSpace: 'nowrap' }}>
                GLOBAL CHASE
              </span>
              <DifficultyBadge d={diff} size="md" />
            </div>
          </div>
          {/* Right: score */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, border: '1px solid rgba(200,168,76,0.3)', borderRadius: 2, padding: '4px 10px', background: 'rgba(200,168,76,0.08)' }}>
              <span style={{ color: '#e8d5a0', fontWeight: 700, fontSize: 24, lineHeight: 1, fontFamily: "'Oswald', sans-serif" }}>{score}</span>
              <span style={{ color: '#c9a84c', fontSize: 16, fontWeight: 700, letterSpacing: '0.14em', fontFamily: "'Courier New', Courier, monospace", alignSelf: 'center' }}>PTS</span>
            </div>
          </div>
        </div>
        {/* Horizontal timer row */}
        <div style={{ padding: '4px 0 2px' }}>
          {!answered
            ? <CountdownTimer timeLeft={timeLeft} total={timerTotal} />
            : <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#f0e8d4', fontFamily: "'Courier New', monospace", letterSpacing: '0.15em', padding: '6px 16px' }}>{timeLeft === 0 ? '— TIME UP —' : '— ANSWER SUBMITTED —'}</div>
          }
        </div>
        {/* Sub-rule + progress */}
        <div style={{ borderTop: '1px solid rgba(200,168,76,0.2)', margin: '5px 16px 0', paddingTop: 3, paddingBottom: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, color: '#f0e8d4', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.14em', fontWeight: 600, flexShrink: 0 }}>
            CASE {currentLevel + 1} / 3
          </span>
          <ProgressBar current={currentLevel} total={3} />
          <div style={{ height: 1, flex: 1, background: 'rgba(200,168,76,0.15)' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(200,168,76,0.7)', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.1em', flexShrink: 0 }}>
            {results.length > 0 ? Math.round((results.filter(r => r.correct).length / results.length) * 100) : 0}% CAPTURED
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', padding: '10px 14px', gap: 12 }}>

        {/* ── Left: Case File Panel ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4 }}
            style={{ width: 430, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 2 }}
          >
            {/* ── Polaroid Evidence Photo ── */}
            <div
              style={{ background: '#f0ebe0', padding: '6px 6px 28px 6px', boxShadow: '3px 5px 18px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.06)', transform: 'rotate(-1.5deg)', borderRadius: 2, cursor: 'zoom-in', flexShrink: 0, position: 'relative' }}
              onClick={() => setImageZoomed(true)}
            >
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <ImageWithFallback
                  src={level.imageUrl}
                  alt={`Case ${currentLevel + 1}`}
                  className="w-full object-cover"
                  style={{ height: 290, display: 'block' }}
                />
                {!answered && (() => {
                  const pct = timeLeft / timerTotal;
                  const barColor = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444';
                  const shouldPulse = pct < 0.15;
                  return (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 5 }}>
                      <div style={{
                        height: '100%',
                        background: barColor,
                        width: `${pct * 100}%`,
                        transition: 'width 1s linear, background-color 0.5s ease',
                        borderRadius: 5,
                        animation: shouldPulse ? 'timer-bar-pulse 0.5s ease-in-out infinite' : 'none',
                      }} />
                    </div>
                  );
                })()}
                {/* RED CLASSIFIED stamp */}
                <div style={{ position: 'absolute', top: 8, right: 8, border: '2px solid rgba(180,20,20,0.85)', borderRadius: 2, padding: '2px 6px', color: 'rgba(180,20,20,0.85)', fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', transform: 'rotate(8deg)', background: 'rgba(255,255,255,0.1)' }}>
                  CLASSIFIED
                </div>
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <DifficultyBadge d={diff} />
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 8, background: 'rgba(0,0,0,0.45)', borderRadius: '3px 3px 0 0', padding: '2px 5px', fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Search style={{ width: 7, height: 7 }} /> zoom
                </div>
              </div>
              {/* Polaroid label */}
              <div style={{ paddingTop: 6, textAlign: 'center' }}>
                <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13, color: '#3a2a1a', letterSpacing: '0.12em', fontWeight: 600 }}>
                  CASE #{String(currentLevel + 1).padStart(3, '0')} — CRIME SCENE
                </span>
              </div>
            </div>

            {/* ── Telegram — Intercepted Signal ── */}
            <div style={{
              backgroundColor: '#f0e6c2',
              backgroundImage: 'radial-gradient(ellipse at 85% 15%, rgba(139,85,20,0.22) 0%, transparent 42%), radial-gradient(ellipse at 12% 88%, rgba(110,68,15,0.14) 0%, transparent 36%)',
              color: '#1a1008',
              fontFamily: "'Courier New', Courier, monospace",
              padding: '0 0 11px 0',
              borderRadius: '1px 4px 2px 1px',
              border: '1px solid rgba(120,80,20,0.28)',
              borderTop: '3px solid #5c3208',
              boxShadow: '2px 4px 14px rgba(0,0,0,0.55), inset 0 0 40px rgba(80,50,0,0.05)',
              transform: 'rotate(0.6deg)',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Telegram header — dark bar with title */}
              <div style={{
                background: 'linear-gradient(90deg, #3b1d07 0%, #4a2509 100%)',
                padding: '6px 13px 5px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10,
                borderBottom: '1px solid rgba(80,40,5,0.6)',
              }}>
                {/* Left: source */}
                <div>
                  <div style={{ fontSize: 15, letterSpacing: '0.12em', color: '#e8c878', fontWeight: 700, lineHeight: 1.2 }}>INTERPOL SECURE LINE</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(220,185,100,0.6)', letterSpacing: '0.1em', marginTop: 1 }}>FROM: FIELD OPERATIVE</div>
                </div>
                {/* Right: priority + animated signal dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: '#e8a060', letterSpacing: '0.12em', fontWeight: 700 }}>PRIORITY: URGENT</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(220,185,100,0.55)', letterSpacing: '0.1em' }}>INTERCEPTED</div>
                  </div>
                  {/* Live signal dot */}
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'tw-blink 1.2s step-end infinite', flexShrink: 0 }} />
                </div>
              </div>

              {/* ENCRYPTED rubber stamp — rotated, ink-bleed style */}
              <motion.div
                initial={{ scale: 2.2, opacity: 0, rotate: 15 }}
                animate={{ scale: 1, opacity: 1, rotate: 12 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  position: 'absolute', top: 38, right: 10,
                  border: '2.5px solid rgba(140,20,20,0.72)',
                  borderRadius: 3,
                  padding: '3px 9px',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 13, fontWeight: 900, letterSpacing: '0.22em',
                  color: 'rgba(140,20,20,0.72)',
                  background: 'rgba(140,20,20,0.05)',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  zIndex: 2,
                  transform: 'rotate(12deg)',
                  textShadow: '0.4px 0.4px 0 rgba(140,20,20,0.3)',
                  boxShadow: 'inset 0 0 0 1px rgba(140,20,20,0.12)',
                }}
              >
                ENCRYPTED
              </motion.div>

              {/* Body padding wrapper */}
              <div style={{ padding: '0 13px' }}>
              {/* Telegram body — teletype printing effect */}
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, letterSpacing: '0.03em', color: '#1a1008', fontFamily: "'Courier New', Courier, monospace", minHeight: '4.5em' }}>
                <TypewriterText
                  key={level.id}
                  speed={30}
                  text={
                    level.thiefClue
                      .replace(/\.\.\.$/, '')                          // remove trailing ellipsis
                      .replace(/\.\.\. /g, ' ▪STOP▪ ')                 // internal ... → STOP
                      .replace(/\. ([A-Z])/g, (_: string, c: string) => ` ▪STOP▪ ${c}`) // sentence break → STOP
                      .trim()
                  }
                />
              </p>
              </div>{/* end body padding wrapper */}
            </div>{/* end telegram */}

            {/* ── Field Intelligence — Clue Notes ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(40,25,8,0.7)', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  — Intel · {revealedClues.length}/{maxClues} decrypted —
                </span>
                {revealedClues.length < maxClues && !answered && (
                  <motion.button
                    onClick={revealNextClue}
                    whileHover={{ scale: 1.06, backgroundColor: 'rgba(40,25,8,0.14)' }}
                    whileTap={{ scale: 0.93 }}
                    style={{ padding: '10px 20px', borderRadius: 4, border: 'none', background: '#5a1a08', color: '#f0e8d4', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.06em' }}
                  >
                    ▸ Decrypt clue −{calcPoints(revealedClues.length) - calcPoints(revealedClues.length + 1)}pts
                  </motion.button>
                )}
              </div>
              {revealedClues.length < maxClues && !answered && (
                <div style={{ fontSize: 13, color: 'rgba(200,168,130,0.6)', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
                  Fewer clues used = higher score
                </div>
              )}

              {level.clues.map((clue, i) => {
                const revealed = revealedClues.includes(i);
                const diffLocked = i >= maxClues;
                const tilt = ['-0.4deg', '0.5deg', '-0.3deg'][i] ?? '0deg';
                return (
                  <div key={i}>
                    {revealed ? (
                      <motion.div
                        initial={{ opacity: 0, scaleY: 0.08, y: -8 }}
                        animate={{ opacity: 1, scaleY: 1, y: 0, rotate: parseFloat(tilt) }}
                        transition={{ duration: 0.38, type: 'spring', stiffness: 340, damping: 26 }}
                        style={{
                          transformOrigin: 'top center',
                          // newspaper clipping — slightly yellowed newsprint
                          backgroundColor: '#f2ecd4',
                          backgroundImage: `
                            repeating-linear-gradient(transparent, transparent 20px, rgba(0,0,30,0.055) 20px, rgba(0,0,30,0.055) 21px)
                          `,
                          backgroundSize: '100% 21px',
                          backgroundPosition: '0 6px',
                          border: '1px solid rgba(30,18,2,0.25)',
                          borderTop: '3px solid rgba(26,14,4,0.75)',
                          borderRadius: 1,
                          boxShadow: '2px 4px 14px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.5)',
                          padding: '9px 12px 12px 12px',
                          marginBottom: 10,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Newspaper clipping label */}
                        <div style={{
                          fontFamily: "'Courier New', Courier, monospace",
                          fontSize: 13, fontWeight: 900, letterSpacing: '0.25em',
                          color: 'rgba(26,14,4,0.5)',
                          textTransform: 'uppercase',
                          marginBottom: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: '1px solid rgba(26,14,4,0.15)',
                          paddingBottom: 5,
                        }}>
                          <span>FIELD INTELLIGENCE — CLUE {i + 1}</span>
                          <span style={{ opacity: 0.4 }}>CLASSIFIED</span>
                        </div>
                        {/* Body — Courier New typewriter style */}
                        <span style={{
                          fontFamily: "'Courier New', Courier, monospace",
                          fontSize: 16,
                          lineHeight: 1.72,
                          color: '#1a0e04',
                          letterSpacing: '0.02em',
                        }}><TypewriterText text={clue} speed={18} /></span>
                      </motion.div>
                    ) : diffLocked ? (
                      <div style={{ padding: '6px 10px', marginBottom: 6, opacity: 0.4, border: '1px dashed rgba(40,25,8,0.2)', borderRadius: 2 }}>
                        <span style={{ fontSize: 14, color: 'rgba(40,25,8,0.5)', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.06em' }}>
                          Clue {i + 1} — not available at this difficulty
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => { if (!answered) revealNextClue(); }}
                        style={{ padding: '8px 11px', marginBottom: 6, borderRadius: 2, border: '1px dashed rgba(40,25,8,0.22)', background: 'rgba(40,25,8,0.04)', display: 'flex', alignItems: 'center', gap: 8, cursor: answered ? 'default' : 'pointer' }}>
                        <Lock style={{ width: 10, height: 10, color: 'rgba(40,25,8,0.4)', flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: 'rgba(40,25,8,0.45)', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.06em' }}>Clue {i + 1} — sealed</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {!answered && (
                <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(40,25,8,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(40,25,8,0.6)', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.1em' }}>
                    {revealedClues.length === 0 ? '★ CLEAN CAPTURE BONUS' : 'REWARD IF CORRECT'}
                  </span>
                  <span style={{ fontSize: 14, color: '#3a1e06', fontWeight: 700, fontFamily: "'Oswald', sans-serif", letterSpacing: '0.06em' }}>+{calcPoints(revealedClues.length)} PTS</span>
                </div>
              )}
              {answered && results[results.length - 1]?.timedOut && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid rgba(40,25,8,0.1)' }}>
                  <p style={{ fontSize: 13, color: 'rgba(140,30,20,0.75)', lineHeight: 1.6, margin: 0, fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    ▸ Clock ran out — Phantom last seen in {level.country}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Right: Map + Action ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {/* Map — fills all available vertical space */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`map-${currentLevel}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                flex: 1, minHeight: 0, borderRadius: 4, overflow: 'hidden',
                border: isCritical ? '2px solid rgba(180,30,20,0.7)' : '2px solid rgba(40,25,8,0.35)',
                boxShadow: isCritical ? '0 0 20px rgba(180,30,20,0.25)' : '3px 4px 16px rgba(20,12,4,0.35)',
                contain: 'paint', isolation: 'isolate',
              }}
            >
              <GeoGuessrMap
                selectedCountry={selectedCountry}
                correctCountry={answered ? level.mapCountry : undefined}
                wrongCountry={answered && !isCorrect ? selectedCountry : undefined}
                onCountryClick={handleCountryClick}
                disabled={answered}
              />
            </motion.div>
          </AnimatePresence>

          {/* Action bar — ink on aged paper */}
          <div style={{
            flexShrink: 0, borderRadius: 3,
            border: '1.5px solid rgba(40,25,8,0.3)',
            borderTop: '3px solid rgba(40,25,8,0.5)',
            background: '#d0c4a8',
            backgroundImage: 'radial-gradient(ellipse at 95% 5%, rgba(60,35,8,0.08) 0%, transparent 35%)',
            padding: '10px 14px',
            boxShadow: '0 2px 10px rgba(20,12,4,0.25)',
          }}>
            {!answered ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {selectedCountry ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 700, fontFamily: "'Courier New', Courier, monospace", color: '#1a0e04', letterSpacing: '0.04em' }}>
                      <MapPin style={{ width: 18, height: 18, color: '#1a0e04', flexShrink: 0 }} />
                      SUSPECT LOCATED: <strong>{getDisplayName(selectedCountry)}</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: 'rgba(40,25,8,0.65)', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      ▸ Mark suspect location on the map
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(40,25,8,0.5)', fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.08em' }}>
                  DRAG · ZOOM
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedCountry}
                  style={{
                    padding: '14px 32px', borderRadius: 6, fontWeight: 800, fontSize: 18,
                    background: selectedCountry ? '#5a1a08' : 'rgba(40,25,8,0.08)',
                    color: selectedCountry ? '#f0e8d4' : 'rgba(40,25,8,0.25)',
                    border: selectedCountry ? '2px solid rgba(200,168,130,0.5)' : '1px solid rgba(40,25,8,0.12)',
                    cursor: selectedCountry ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: "'Oswald', sans-serif", letterSpacing: '0.08em',
                    boxShadow: selectedCountry ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                >
                  <Search style={{ width: 13, height: 13 }} />
                  MAKE ARREST
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* Result — ink stamp on aged paper */}
                <div style={{
                  flex: 1,
                  backgroundColor: isCorrect ? '#d8e8c8' : '#e8d0c8',
                  backgroundImage: isCorrect
                    ? 'radial-gradient(ellipse at 92% 8%, rgba(40,80,20,0.12) 0%, transparent 40%)'
                    : 'radial-gradient(ellipse at 92% 8%, rgba(100,30,20,0.12) 0%, transparent 40%)',
                  border: `1px solid ${isCorrect ? 'rgba(40,90,20,0.3)' : 'rgba(120,30,20,0.3)'}`,
                  borderLeft: `4px solid ${isCorrect ? 'rgba(40,100,20,0.7)' : 'rgba(140,30,20,0.7)'}`,
                  borderRadius: '1px 3px 3px 1px',
                  padding: '12px 24px', minHeight: 60,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    flexShrink: 0, border: `2px solid ${isCorrect ? 'rgba(40,100,20,0.65)' : 'rgba(140,30,20,0.65)'}`,
                    borderRadius: 2, padding: '3px 5px',
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 16, fontWeight: 800, letterSpacing: '0.12em',
                    color: isCorrect ? 'rgba(30,90,15,0.85)' : 'rgba(140,30,20,0.85)',
                    transform: isCorrect ? 'rotate(-4deg)' : 'rotate(-3deg)',
                    lineHeight: 1.2, textAlign: 'center' as const, minWidth: 38, whiteSpace: 'pre' as const,
                  }}>
                    {isCorrect ? 'CASE\nCLOSED' : results[results.length-1]?.timedOut ? 'TIME\nEXP.' : 'MISS\nFIRE'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2, fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.04em', color: isCorrect ? '#1a4a08' : '#6a1a0a' }}>
                      {isCorrect ? 'Phantom apprehended.' : results[results.length-1]?.timedOut ? 'Time expired — Phantom fled.' : 'Wrong location — Phantom escaped.'}
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(40,25,8,0.55)', margin: 0, fontFamily: "'Georgia', serif" }}>
                      {isCorrect
                        ? `${level.country} confirmed. +${earnedPoints} pts`
                        : results[results.length-1]?.timedOut
                          ? `Phantom was in ${level.country}. Clock ran out.`
                          : `Phantom was in ${level.country}. You guessed ${getDisplayName(selectedCountry || '')}.`}
                    </p>
                  </div>
                </div>
                {/* Case Debrief button — dark ink on paper */}
                <button
                  onClick={openCultureCard}
                  style={{
                    padding: '10px 20px', borderRadius: 2, fontWeight: 700, fontSize: 15,
                    background: '#2a1a06',
                    color: '#f0e8d4',
                    border: '1px solid rgba(60,35,8,0.7)',
                    boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.1), 0 2px 8px rgba(20,10,2,0.35)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    fontFamily: "'Oswald', sans-serif", letterSpacing: '0.08em',
                  }}
                >
                  <BookOpen style={{ width: 13, height: 13, opacity: 0.85 }} />
                  Case Debrief
                  <ChevronRight style={{ width: 11, height: 11, opacity: 0.7 }} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Suspect Briefing Modal ── */}
      <AnimatePresence>
        {showSuspectBriefing && level && SUSPECTS[level.id] && (
          <SuspectBriefing
            suspect={SUSPECTS[level.id]}
            onBegin={() => setShowSuspectBriefing(false)}
            onBack={() => { setShowSuspectBriefing(false); setGameState("difficulty"); }}
          />
        )}
      </AnimatePresence>

      {/* ── Cultural Knowledge Card Modal ── */}
      <AnimatePresence>
        {showCultureCard && (
          <CultureCard
            level={level}
            resolvedImageUrl={level.imageUrl}
            isCorrect={isCorrect}
            points={earnedPoints}
            onContinue={nextLevel}
            isLast={currentLevel + 1 >= 3}
          />
        )}
      </AnimatePresence>

      {/* ── Image Zoom Lightbox ── */}
      <AnimatePresence>
        {imageZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImageZoomed(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              src={level.imageUrl}
              alt="Crime scene"
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}
              onClick={e => e.stopPropagation()}
            />
            <button
              style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: 24, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setImageZoomed(false)}
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
