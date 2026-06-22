# Factorio Wire Art
This website will allow you to convert an image into a sequence of wire connections that can be placed in Factorio with the addition of the Wire Art Mod.

## Description
This project attempts to approximate an image using only wires in Factorio. Various pole generation methods are used including, circle, square, and voronoi stippling. All computation is done in the browser using worker threads, so there is no backend to set up. For the images to display properly in Factorio only small modifications are required including, disabling wire shadows, decreasing wire opacity to 20%, and recoloring copper wire to blue.

# Getting Started
This website has been built and hosted on my github pages at https://alexwittman.github.io/Factorio-Wire-Art/

If you are inclined to run this yourself, you can simply install dependencies, then run `npm run dev`

# Animations
The mod also supports animations. These tend to destroy the framerate in game since thousands of poles and wires are created and destroyed every second, so use at your own discretion.

Inside the `/automation` folder there is a playwright script that can process gif, mp4, and other video formats. It requires you to run the website locally before it will work. It uses a config file to manipulate the website into performing the correct image conversion. I have occasionally had some stalling issues with the script, so it is not as robust as it could be.

To use the `animation.ts` script, run the following command:

    npx ts-node ./automation/animate.ts [video file path] [config json file path] [output file path]

Once complete, the output file will contain a command to run in Factorio. These files can get very large. A 20fps video for 50 seconds (1000 frames) with 500 poles and max wires takes about 175MB of space, which will crash most text editors if you go to copy it from there.

The simplest way to copy using powershell is by running the following:

    Get-Content [output file path] | Set-Clipboard    

When pasting into Factorio, it will lag the game significantly (just to render all the text in the console). I recommend just running the command even though you can't see it, because I've never been able to see it even when waiting for 10 minutes.
