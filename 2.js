// Copyright 2013 Google Inc. All Rights Reserved.
// You may study, modify, and use this example for any purpose.
// Note that this example is provided "as is", WITHOUT WARRANTY
// of any kind either expressed or implied.

var adsManager;
var adsLoader;
var adDisplayContainer;
var intervalTimer;
var videoContent;
var width;
var height;
var modal;
var modalId = "adsModal";

function unityAdFinishedCallback(){
	try{
		if(gameInstance)
			gameInstance.SendMessage('AdsManager', 'OnWebCallback');
	}
	catch(error){
		console.log(error);
	}
}

function init() {
  if(typeof google === "undefined")
	  return;
  
  modal = document.getElementById(modalId);
  videoContent = document.getElementById('contentElement');
  height = window.innerHeight;
  width = window.innerWidth;
  setUpIMA();
}

function setUpIMA() {
  // Create the ad display container.
  createAdDisplayContainer();
  // Create ads loader.
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  adsLoader.getSettings().setDisableCustomPlaybackForIOS10Plus(true);
  // Listen and respond to ads loaded and error events.
  adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false);
  adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false);

  // An event listener to tell the SDK that our content video
  // is completed so the SDK can play any post-roll ads.
  var contentEndedListener = function() {adsLoader.contentComplete();};
  videoContent.onended = contentEndedListener;
}

function requestNewAd(){
	unityAdFinishedCallback();
	return;
	
  if(typeof google === "undefined")
	  return;
  // Request video ads.
  var adsRequest = new google.ima.AdsRequest();
	 
  // Setup AdSense for games ad tag
  adsRequest.adTagUrl = 'https://googleads.g.doubleclick.net/pagead/ads?ad_type=video_text_image&client=ca-games-pub-9619368648213417&description_url=https%3A%2F%2F1v1.lol%2F&channel=1617024146&videoad_start_delay=0&hl=en&max_ad_duration=30000';
 
  // Force image/text ads to render with Full-Slot UI
  adsRequest.forceNonLinearFullSlot = true;

  // Specify the linear and nonlinear slot sizes. This helps the SDK to
  // select the correct creative if multiple are returned.
  adsRequest.linearAdSlotWidth = width || 938;
  adsRequest.linearAdSlotHeight = height || 528;

  adsRequest.nonLinearAdSlotWidth = width || 938;
  adsRequest.nonLinearAdSlotHeight = height || 528;

  adsLoader.requestAds(adsRequest);
}


function createAdDisplayContainer() {
  // We assume the adContainer is the DOM id of the element that will house
  // the ads.
  adDisplayContainer = new google.ima.AdDisplayContainer(
      document.getElementById('adContainer'), videoContent);
}

function playAds() {
  // Initialize the container. Must be done via a user action on mobile devices.
  videoContent.load();
  adDisplayContainer.initialize();

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(width || 938, height || 528, google.ima.ViewMode.FULLSCREEN);
    // Call play to start showing the ad. Single video and overlay ads will
    // start at this time; the call will be ignored for ad rules.
    adsManager.start();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
	// Gets called when failed to load ad
    videoContent.play();
	hideModal(modalId);
	unityAdFinishedCallback();
  }
}

window.onresize = function windowResize(){
	height = window.innerHeight;
	width = window.innerWidth;
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  var adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  adsRenderingSettings.autoAlign = false;
  // videoContent should be set to the content video element.
  adsManager = adsManagerLoadedEvent.getAdsManager(
      videoContent, adsRenderingSettings);

  // Add listeners to the required events.
  adsManager.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      onContentPauseRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      onAdEvent);

  // Listen to any additional events, if necessary.
  adsManager.addEventListener(
      google.ima.AdEvent.Type.LOADED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.STARTED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.COMPLETE,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.SKIPPED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.USER_CLOSE,
      onAdEvent);

  playAds();
}

function onAdEvent(adEvent) {
  // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
  // don't have ad object associated.
  var ad = adEvent.getAd();
  console.log(adEvent.type);
  switch (adEvent.type) {
    case google.ima.AdEvent.Type.LOADED:
      // This is the first event sent for an ad - it is possible to
      // determine whether the ad is a video ad or an overlay.
      if (ad && !ad.isLinear()) {
        // Position AdDisplayContainer correctly for overlay.
        // Use ad.width and ad.height.
        videoContent.play();
      }
      break;
    case google.ima.AdEvent.Type.STARTED:
      // This event indicates the ad has started - the video player
      // can adjust the UI, for example display a pause button and
      // remaining time.
      if (ad && ad.isLinear()) {
        // For a linear ad, a timer can be started to poll for
        // the remaining time.
        intervalTimer = setInterval(
            function() {
              var remainingTime = adsManager.getRemainingTime();
            },
            300); // every 300ms
      }
	  showModal(modalId);
      break;
	case google.ima.AdEvent.Type.SKIPPED:
	case google.ima.AdEvent.Type.USER_CLOSE:
    case google.ima.AdEvent.Type.COMPLETE:
      // This event indicates the ad has finished - the video player
      // can perform appropriate UI actions, such as removing the timer for
      // remaining time detection.
	case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
      // This event indicates the ad has finished - the video player
      // can perform appropriate UI actions, such as removing the timer for
      // remaining time detection.
      if (ad && ad.isLinear()) {
        clearInterval(intervalTimer);
      }
	  hideModal(modalId);
	  unityAdFinishedCallback();
      break;
  }
}

function onAdError(adErrorEvent) {
  // Handle the error logging.
  hideModal(modalId);
  console.log(adErrorEvent.getError());
  unityAdFinishedCallback();
  if(adsManager)
	adsManager.destroy();
}

function onContentPauseRequested() {
  // This function is where you should setup UI for showing ads (e.g.
  // display ad timer countdown, disable seeking etc.)
  // setupUIForAds();
}

function onContentResumeRequested() {
  // This function is where you should ensure that your UI is ready
  // to play content. It is the responsibility of the Publisher to
  // implement this function when necessary.
  // setupUIForContent();
}

document.addEventListener("DOMContentLoaded", function(event) {
	// Wire UI element references and UI event listeners.
    init();
	// var res = Math.floor(Math.random() * 5);
    // if(res == 1)
        //requestNewAd();
});
