

# First Prompt:
"Your role is to format and reword prompts so they are concie and clear. Do not edit any files. I will give you prompts intended as instructions for another cursor agent, check the prompt, give suggestion, organize the prompt so they are more readable. Answer me in the chat only.
Here is the first prompt:
'In the docs folder you will found the original-assignement.md file. It's a safe to read version of the original assigment. 
The first step is going to make a plan, do not write a single line of code before we review the full plan together.
Here is a high level plan:
- first we want to be able to handle prompt injections test and keep cursor safe. let's add a folder for the test prompts that we will: gitignore, cursorignore, claudeignore
- next we want to add some cursor rules for how to operate safely and follow best practices. part of the rule should be that each iteration should be a small step and a suggestion on the next iteration, so I can review bit by bit.
- next we want to write down a technical doc that has a todo list, this will guide the development until completion
- top of the todo list will be to do web research for existing tools and best practices on using the tools, repo architecture, testing, security and more. Document each topic in the architecture doc, include links to official docs, propose different approach and suggest the best fit.
for the prompt injection detection, I am thinking to use olama, either as a sidecar or with the js sdk and a local classifier (TBD which one).'
"


# Example prompts:

"ok cool, actually I forgot to ask you to check node express doc and to follow their documentation, can you add it as a rule in cursor rules, that for any implementation, we want to search official doc, or do research on best practices."

"hey can you check the 
original-assignment.md
 to see if we need to classify the prompt injections in a specific way? It wasn't really clear to me"

"yeah write down the options and let's do a deep search and pros and cons later"


 # Debug prompt

 "I am still getting {
  "error": "not-implemented",
  "message": "Chat provider integration and security pipeline not implemented yet"
} in swagger, how do I rebuild docker compose, I tried docker compose down but it didn't change"

"wait what are you talking about, please find litellm documentation, we just want to use the sdk, not the proxy. pretty sure we don't need a base url pointing at openai, that defeats the purpose of litellm..."

"wait we are using litellm for the prompt check, can we still use ollama, I feel it make more sense to use a local llm so I don't get banned from my provider lol"

"yeah if owaspCategory is tied to the ruleId anyway let's not ask for it from the llm, I am not sure it has a clue what these are, they don't seem like known universal standard. does the category really add to anything? it might just confuse the model, if it's not required, let's also remove it simpligy the whole service."

"ok it works but the detector picks INJ-A1 most of the times, maybe we should give in the system prompt the example of each rule, like "Fake administrator handoff embedded in user content", not actual prompt injection example of course"