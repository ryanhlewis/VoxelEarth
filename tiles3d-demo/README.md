#  🗺️ The Importance of Vegetation for Cities Story Map

This repository contains the source code for the [The Importance of Vegetation for Cities story map](https://3dtiles.carto.com).

<img width="1093" alt="Captura de Pantalla 2023-04-24 a las 16 47 58" src="https://user-images.githubusercontent.com/1161870/234032881-6da79cd7-7b87-4259-84af-11761a319d97.png">

Checkout also the overall technical blog post we published if you want to get more context.

## 🧱 Overall structure of the code

We are following a classical React App structure.

 * `assets`: images, icons, etc.
 * `components`: JSX components of the app
 * `layers`: where the actual juice is. With each slide/visualization on a separate file

## 🏃🏽‍♀️ How to run it

Checkout the code and...

Install all dependencies with:

```yarn```

Specify your Google Maps API Key to use. You can get a Google Maps API Key on the GCP console. Remember to authorize localhost to it. You will need to update .env file with your API key.

```yarn start```

will start the server on localhost:8080

## How to build it

```yarn build```

Then deploy the files in the `dist` folder to a web server of your choice.

## 💬 issues/comments/whatever?

You can contact CARTO always at contact@carto.com, but we also hangout on the CARTO Users community Slack server:

https://cartousercommunity.slack.com/join/shared_invite/zt-t7t7k5s4-3c4pZJLrLlkVow3AEDt~ZQ#/shared-invite/email

  

