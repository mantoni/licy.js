# Licy concept

There are many questions to answer when building modules, and it's sometimes
hard to find answers up front. Can you create a UI widget synchronous or
asynchronous? Do I need to notify other part of the system? Do I have to
unregister from other objects when done? Am I responsible for destroying other
objects? Changing these aspects later often requires a major refactoring.

Licy does not try to answer these questions. Instead, it allows you to change
the behavior later, or even at runtime. It allows you to add functionality
dynamically, similar to AOP, to implement solutions for cross cutting concerns
in one place. It guarantees callback invokation, child object destruction and
event listener deregistration.

## Async creation and communication

- Lazy initialization, e.g. fetching data asynchronously from an external
  source
- Changing a synchronous call to asynchronous

## Cross cutting concerns

- Logging, security checks, transaction management, performance measurements

## Destroying objects

- Also destroying other objects
- Unregistering from other objects
- Dealing with calls to destroyed objects

