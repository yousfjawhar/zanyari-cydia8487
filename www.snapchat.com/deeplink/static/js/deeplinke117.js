var ANDROID_PLAY_STORE = 'market://details?id=com.snapchat.android&referrer=source%3Ddeeplink';

var MONTH_STR = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
    'November', 'December'];

var userAgentParams = {
    'data-android': ['Android'],
    'data-ios': ['iPod', 'iPhone', 'iPad'],
    'data-chrome': ['Chrome'],
    'data-twitter': ['Twitter'],
    'data-facebook': ['facebook', 'FB'],
    'data-samsung': ['SamsungBrowser'],
}

function hasPrefix(str, prefix) {
    return str.lastIndexOf(prefix, 0) == 0;
}

function redirectTo(url) {
    if (hasPrefix(url, 'https://') || hasPrefix(url, 'snapchat') || hasPrefix(url, 'market://') || hasPrefix(url, 'intent://')) {
        window.location = url;
    }
}

function openDeepLink(deepLink, marketLink) {
    var clicked = new Date();
    var timeout = 250;
    redirectTo(deepLink);
    if (marketLink) {
        setTimeout(function() {
            if (new Date() - clicked < timeout * 2) {
                logAndroidMarketRedirect('auto');
                redirectTo(marketLink);
            }
        }, timeout);
    }
}

function openIOSDeepLink(deepLink) {
    openDeepLink(deepLink, null);
}

function openAndroidDeepLink(deepLink, noFallback) {
    var marketLink;
    if (noFallback) {
        marketLink = null;
    } else {
        marketLink = $('input[id="android_install_uri"]').val();
        if (!marketLink) {
            marketLink = ANDROID_PLAY_STORE;
        }
    }
    openDeepLink(deepLink, marketLink);
}

function findMatch(str, patterns) {
    for (var i = 0; i < patterns.length; i++) {
        if (str.indexOf(patterns[i]) != -1) {
            return true;
        }
    }
    return false;
}

function isMatch(element) {
    for (var key in userAgentParams) {
        var val = element.attr(key);
        if (!val) {
            continue;
        }
        val = (val == 'true');
        var matched = findMatch(navigator.userAgent, userAgentParams[key]);
        if (val != matched) {
            return false;
        }
    }
    return true;
}

function formatDate(epoch) {
    var ts = parseInt(epoch);
    var date = new Date(ts);
    if (!ts || isNaN(date.getTime())) {
        return '';
    }
    return MONTH_STR[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function logAndroidMarketRedirect(type) {
    var marketLink = $('input[id="android_install_uri"]').val();
    if (findMatch(navigator.userAgent, ['Android']) && marketLink && marketLink.includes('add')) {
        var xmlHttp = new XMLHttpRequest();
        var url = 'https://' + window.location.host + '/deeplink/redirect/' + type
        xmlHttp.open('GET', url);
        xmlHttp.send();
    }
}

function handleDeepLink() {
  if (findMatch(navigator.userAgent, ['Twitter', 'FB']) && !findMatch(navigator.userAgent, ['Android']) &&
          window.location.host == 'www.snapchat.com') {
      window.location.host = 'go.snapchat.com';
      return;
  }

  $('.webPubDate').each(function(index, element) {
      var tag = $(element);
      var ts = tag.attr('data-epoch');
      if (ts) {
          tag.html(formatDate(ts));
      }
  });

  $('input[name="auto_open"]').each(function(index, element) {
      var tag = $(element);
      if (isMatch(tag)) {
          var deepLink = tag.val();
          var fallback = tag.attr('data-fallback');
          if (!fallback) {
              openDeepLink(deepLink, null);
          }
          if (fallback == 'ios') {
              openIOSDeepLink(deepLink);
          }
          if (fallback == 'android') {
              openAndroidDeepLink(deepLink);
          }
      }
  });

  $('.webButton').each(function(index, element) {
      var tag = $(element);
      if (isMatch(tag)) {
          tag.removeClass('hidden');
      }
  });
}

$(document).ready(function() {
  var path = '';
  try {
    path = window.location.pathname;
  } catch (e) {}

  var isAddPage = path.indexOf('/add/') === 0;

  if (isAddPage) {
    // Google Analytics
    try {
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

      // Google Analytics pageview
      // TODO add event if we need it
      ga('create', 'UA-41740027-1', 'auto');
      ga('send', 'pageview', { hitCallback: handleDeepLink });
    } catch(e) {
      handleDeepLink();
    }
  } else {
    handleDeepLink();
  }
});

$('#download_snapchat').click(function() {
    logAndroidMarketRedirect('click');
});
