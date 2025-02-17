# Design: Stream Asset Management

The ability for users to host their own assets for their streams enables them to create powerful graphics and informational tools to enhance their stream.  These assets were managed by static files on the users streaming device and may have required manual manipulation to maintain.  

![Stream Asset Management](/docs/images/stream-asset-diagram.png)

---
## Origin

Early on in working with OBS Studio, I realized that the "_Browser Source_" (which allows you to display a web page or local html file on your stream) was in fact just a headless browser (a browser without all the navigation stuff).  

After doing some experimentation with HTML documents supported by CSS for styles and Javascript for driving changes on the page, I concluded that it was possible to build any custom assets using web technologies in order to create a dynamic broadcast.  

My first example was a countdown timer driven by Javascript:

```html
<html>
<body>
  <h1 id="label"></h1>
  <h1 id="timer" hidden></h1>

  <script>    
    const MS_to_SEC = 1000;
    const SEC_to_MIN = MS_to_SEC * 60;

    const startTime = new Date(2024, 10,17,18,30);
    const label = document.getElementById('label');
    const timer = document.getElementById('timer');

    function padNumber(input, padSize = 2) {
      return new Intl.NumberFormat('en-US', { minimumIntegerDigits: padSize }).format(input);
    }

    const countdown = setInterval(() => {
      const now = new Date();
      const diff = startTime.valueOf() - now.valueOf()
      const isSoon = diff <= (5 * SEC_to_MIN);

      // Timer Ended
      if (startTime.valueOf() <= now.valueOf()) {
        label.textContent = 'Starting...';
        label.classList.add('blink');
        timer.style.opacity = '0';
        clearInterval(countdown);
        return;
      }

      label.classList.remove('blink');
      if (!isSoon) {
        label.textContent = 'Starting Soon'
        timer.hidden = true;
      } else {
        const minutes = Math.floor(diff / SEC_to_MIN);
        const seconds = Math.floor((diff - (minutes * SEC_to_MIN)) / MS_to_SEC);

        timer.hidden = false;
        label.textContent = 'Starting In'
        timer.textContent = `${padNumber(minutes)}:${padNumber(seconds)}`;
      }
    }, 1000);


  </script>
</body>
</html>
```

This simple document will calculate the remaining duration to a given start time.  Based on that, it will show one of a few states once loaded into the _Browser Source_ in _OBS Studio_.  Changing the `startTime` variable and reloading the source triggers the Javascript to run and update the label/timer elements based on results.

---
## Requirements

With design it is important to start off with what are the key requirements of the feature.  For this feature we have the following;

1. File Management
   1. Application should provide an endpoint for authorized users to upload and store files
   2. Application should provide an endpoint for authorized users to pull their assets from the system
   3. Application should overwrite assets when uploaded over one another
   4. Application should only accept HTML, CSS, and Javascript files
2. Security
   1. The Application should keep assets private per user
3. Streaming/Hosting
   1. Application should honor query parameters when fetching an asset
   2. Application should provide a library for query parameter parsing available to the users

---
## Design