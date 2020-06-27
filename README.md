# Cake Time

Skill que sabe sua idade a sua data de aniversário    

Ps: Cada ação é definida por um objeto contendo duas funções

    * canHandle: Verifica que esse objeto é responsavel para tratar a acao solicitada
    * handle: Execução da ação,  interaçao com usuario, api , etc...


Para usar numeral verificar SSML (Speed Synthesis Markup Language)

## Conceitos

* Intenção: Ação para atender a solicitação de um usuário
* Enunciado: è o que invoca a intenção
* Slots: São as variaveis

## Funções:

* ResponseBuilder: Função que compila a responsa
* Speak: Resposta qua a alexa deve falar 
* reprompt: agudar a resposta do usuario apos uma pergunta e realizar novamente a pergunta caso o usuario nao responda
