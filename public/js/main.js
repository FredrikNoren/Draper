function parseHash(e){crossroads.parse(e)}function browseTo(e){hasher.setHash(e)}var requestAnimationFrame=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame;window.requestAnimationFrame=requestAnimationFrame,ko.bindingHandlers.debug={init:function(e,t){var n=ko.utils.unwrapObservable(t());console.log("DEBUG INIT",n)},update:function(e,t){var n=ko.utils.unwrapObservable(t());console.log("DEBUG UPDATE",n)}},ko.bindingHandlers.fastClick={init:function(e,t,n,r){var o=t();new google.ui.FastButton(e,function(){var e=ko.utils.unwrapObservable(o);e.call(r)})}},ko.bindingHandlers.editableText={init:function(e,t){$(e).on("blur",function(){var e=t();e($(this).text())})},update:function(e,t){var n=ko.utils.unwrapObservable(t());$(e).text(n)}};var currentlyDraggingViewModel=null;ko.bindingHandlers.dragStart={init:function(e,t,n,r){var o=t();e.addEventListener("dragstart",function(e){e.dataTransfer.setData("Text","ungit"),currentlyDraggingViewModel=r;var t=ko.utils.unwrapObservable(o);t.call(r,!0)})}},ko.bindingHandlers.dragEnd={init:function(e,t,n,r){var o=t();e.addEventListener("dragend",function(){currentlyDraggingViewModel=null;var e=ko.utils.unwrapObservable(o);e.call(r,!1)})}},ko.bindingHandlers.dropOver={init:function(e,t){e.addEventListener("dragover",function(e){var n=t(),r=ko.utils.unwrapObservable(n);return r?(e.preventDefault&&e.preventDefault(),e.dataTransfer.dropEffect="move",!1):void 0})}},ko.bindingHandlers.dragEnter={init:function(e,t,n,r){e.addEventListener("dragenter",function(){var e=t(),n=ko.utils.unwrapObservable(e);n.call(r,currentlyDraggingViewModel)})}},ko.bindingHandlers.dragLeave={init:function(e,t,n,r){e.addEventListener("dragleave",function(){var e=t(),n=ko.utils.unwrapObservable(e);n.call(r,currentlyDraggingViewModel)})}},ko.bindingHandlers.drop={init:function(e,t,n,r){var o=t();e.addEventListener("drop",function(e){e.preventDefault&&e.preventDefault();var t=ko.utils.unwrapObservable(o);t.call(r,currentlyDraggingViewModel)})}},ko.bindingHandlers.graphLog={init:function(e,t){var n=$('<canvas width="200" height="500">');$(e).append(n);var r=function(){var e=ko.utils.unwrapObservable(t());logRenderer.render(n.get(0),e),$.contains(document.body,n.get(0))&&window.requestAnimationFrame(r)};window.requestAnimationFrame(r)}},ko.bindingHandlers.shown={init:function(e,t,n,r){var o=t(),i=ko.utils.unwrapObservable(o);i.call(r)}},ko.bindingHandlers.scrolledToEnd={init:function(e,t,n,r){var o=function(){var n=$(e).offset().top+$(e).height(),o=$(document).scrollTop()+document.documentElement.clientHeight;if(o>n-document.documentElement.clientHeight/2){var i=t(),a=ko.utils.unwrapObservable(i);a.call(r)}};$(window).scroll(o),$(window).resize(o)}},ko.bindingHandlers.modal={init:function(e,t,n,r){$(e).modal();var o=ko.utils.unwrapObservable(t());$(e).on("hidden.bs.modal",function(){o.onclose.call(r)}),o.closer.call(r,function(){$(e).modal("hide")})}};var prevTimestamp=0,updateAnimationFrame=function(e){var t=e-prevTimestamp;prevTimestamp=e,app.updateAnimationFrame(t),window.requestAnimationFrame(updateAnimationFrame)};window.requestAnimationFrame(updateAnimationFrame),window.onerror=function(){ungit.config.bugtracking&&window.bugsense.onerror.apply(window.bugsense,arguments),app.content(new CrashViewModel)},api=new Api;var main=new MainViewModel,app=new AppViewModel(main);ko.applyBindings(app),hasher.initialized.add(parseHash),hasher.changed.add(parseHash),hasher.init(),$(document).ready(function(){$().dndPageScroll()});