# Proposal

## Building a scheduler / tracker for my gym routine. Similar to a to-do list, it will show me today's gym set with functionality to cross off sets as they are completed.

## Why: I want to take my health more seriously and start going to the gym. One thing that will help me remain consistent in going is knowing exactly what I'm supposed to be doing on the day, and being able to cross off each work-out as I complete them will motivate me to continue going, and finish my routine.

## Core Features:
- Display daily/weekly sets
- Cross off individual sets
- Functionality to randomize workouts as needed
- Functionality to easily add more workouts as needed
- Simple drag-and-drop reordering of workout items

## What I don't know yet: Adding scripting with Javascript to cross off displayed sets, easily input new routines on top of the pre-set ones if I want to, delete ones and replace it with others.

## JavaScript concepts I need to learn:
- Variables and data types (`let`, `const`, strings, numbers, booleans, arrays, objects)
- Arrays and object methods (`map`, `filter`, `find`, `forEach`) to manage workout lists
- Functions and arrow functions for reusable actions like add, delete, randomize, and complete
- Conditional logic (`if/else`, ternary operators) for workout state (completed vs not completed)
- DOM manipulation (`querySelector`, `createElement`, `appendChild`, `classList`) to render sets/workouts on screen
- Event handling (`addEventListener`) for checkbox clicks, add buttons, delete buttons, and randomize actions
- Local storage (`localStorage`) so routines and progress persist after refreshing/closing the browser
- Date/time basics (`Date`) to show daily vs weekly routines
- Randomization logic (`Math.random`) to rotate workouts fairly
