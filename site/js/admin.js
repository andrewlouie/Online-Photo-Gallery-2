$(function() {
	$.ajax({
		method: "GET",
		url: options.url + "ListAlbums/" + options.userName + ".json",
		async: false
	}).success(function(result) {
		result = result.Success;
		for (var x in result) {
			$('<li/>', {
				"data-sortOrder": result[x].sortOrder,
				html: '<a href="#bar" data-transition="slide" data-thumbnail="' + 
				result[x].thumbnail + 
				'">' + 
				'<img src="' + 
				options.staticFolder + options.userName + '/' + result[x].title + '/' + result[x].thumbnail + 
				'"><h2>' + 
				result[x].title + 
				'</h2><p>' + 
				result[x].description + 
				'</p></a><a href="#purchase" data-title="' + 
				result[x].title + 
				'" data-desc="' + 
				result[x].description + 
				'" data-rel="popup" data-position-to="window" data-transition="pop">Update</a>'
			}).appendTo('#sortable');
		}
		$( "#sortable" ).sortable();
		$( "#sortable" ).disableSelection();
		$( "#sortable" ).bind( "sortstop", function(event, ui) {
		  $('#sortable').listview('refresh');
		  $('li').each(function(index) { 
		  	if ((parseInt($(this).attr('data-sortorder'),10) || 0) != index) {
				$(this).attr('data-sortorder',index);
				$.ajax({
					method:"POST",
					url: options.url + "SetSortOrder",
					xhrFields: { withCredentials: true },
					data: { albumName: $(this).find('h2').html(), sortOrder: index }
				}).success(function(result) {
					if (result.Error) myalert(result.Error);
				});
			}
			else (highest = parseInt($(this).attr('data-sortorder'),10) || 0) + 1;
		  });
		});
	});
});
$('html').on('click', 'a[href="#purchase"]',function() {
	$('#update-title').val($(this).attr('data-title'));
	$('#update-desc').val($(this).attr('data-desc'));
	$('#update-confirm').attr('data-open', $(this).attr('data-title'));
});
$('html').on('click', '#update-confirm', function(){
	var newtitle = $('#update-title').val().trim();
	var newdesc = $('#update-desc').val();
	var oldtitle = $(this).attr('data-open');
	var olddesc = $('a[data-title="' + oldtitle + '"]').attr('data-desc');
	if (newtitle != oldtitle) {
		$.ajax({
			method: "POST",
			url: options.url + "RenameAlbum",
			 xhrFields: { withCredentials: true },
			data: { albumName: $(this).attr('data-open'), newName: newtitle }
		}).success(function(result) {
			if (result.Error) myalert(JSON.stringify(result.Error));
			else {
				$('a[data-title="' + oldtitle + '"]').attr('data-title',newtitle).prev().find('h2').html(newtitle);
				if (newdesc != olddesc) updateDesc(newtitle,newdesc);
			}
		});
	}
	else if (newdesc != olddesc) updateDesc(oldtitle,newdesc);
});
function updateDesc(title, newdesc) {
	$.ajax({
			method: "POST",
			 xhrFields: { withCredentials: true },
			url: options.url + "ChangeAlbumDesc",
			data: { albumName: title, description: newdesc }
		}).success(function(result) {
			if (result.Error) myalert(result.Error);
			else {
				$('a[data-title="' + title + '"]').attr('data-desc',newdesc).prev().find('p').html(newdesc);
			}
		});
}
$('html').on('click','#deleteAlbum',function() {
	$.ajax({
			method: "POST",
			xhrFields: { withCredentials: true },
			url: options.url + "DeleteAlbum",
			data: { albumName: $('#update-confirm').attr('data-open') }
		}).success(function(result) {
			if (result.Error) myalert(result.Error);
			else {
				$('a[data-title="' + $('#update-confirm').attr('data-open') + '"]').parent().remove();
			}
		});
});
$('html').on('click','#newAlbumConfirm',function() {
	var title = $('#newAlbumName').val().trim();
	var description = $('#newAlbumDescription').val();
	$.ajax({
		method: "POST",
		xhrFields: { withCredentials: true },
		url: options.url + "NewAlbum",
		data: { albumName: title,description: description }
	}).success(function(result) {
		if (result.Error) myalert(result.Error);
		else {
			$('<li/>', {
				"data-sortOrder": 0,
				html: '<a href="#bar" data-transition="slide">' + 
				'<img src="' + 
				options.staticFolder + options.userName + '/' + title + '/' + '../../placeholder.png' + 
				'"><h2>' + 
				title + 
				'</h2><p>' + 
				description + 
				'</p></a><a href="#purchase" data-title="' + 
				title + 
				'" data-desc="' + 
				description + 
				'" data-rel="popup" data-position-to="window" data-transition="pop">Update</a>'
			}).prependTo('#sortable');
			$('#sortable').listview('refresh');
		}
	});
});
$('html').on('click','a[href="#bar"]',function() {
	$('#albumTitle').attr('data-thumbnail',$(this).attr('data-thumbnail'));
	var newtitle = $(this).find('h2').html();
	$('#albumName').find('h2').html(newtitle);
	$.ajax({
		method: "GET",
		url: options.url + "GetAlbum/" + options.userName + "/" + newtitle + ".json",
		async: false
	}).success(function(result) {
		result = result.Success;
		for (var x in result) {
			$('<li/>', {
				"data-sortOrder": result[x].sortOrder,
				html: '<a href="#aa' + 
				result[x].filename.replace(" ","/") + 
				'" data-rel="popup" data-position-to="window" data-transition="fade">' + 
				'<img src="' + 
				options.staticFolder + options.userName + '/' + newtitle + '/' + result[x].filename + 
				'"><h2>' + 
				result[x].filename + 
				'</h2><p>' + 
				result[x].description + 
				'</p></a><a href="#options" data-title="' + 
				result[x].filename + 
				'" data-desc="' + 
				result[x].description + 
				'" data-rel="popup" data-position-to="window" data-transition="pop">Update</a>'
			}).appendTo('#sortable2');
			var $testyep = $('<div/>', {
				"data-role": "popup",
				id: "aa" + result[x].filename.replace(" ","/"),
				"data-overlay-theme": "b",
				"data-theme": "b",
				"data-corners": false,
				html: '<a href="#" data-rel="back" class="ui-btn ui-corner-all ui-shadow ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right">Close</a><img class="popphoto" src="' + 
				options.staticFolder + options.userName + '/' + newtitle + '/' + result[x].filename + 
				'" style="max-height:512px;" alt="Paris, France">'	
			}).appendTo('#sortable2').popup().trigger("create");
		}
		$('#sortable2').listview('refresh');
	});
});
$('html').on('click', 'a[href="#options"]',function() {
	$('#photoName').val($(this).attr('data-title'));
	$('#photoDescription').val($(this).attr('data-desc'));
	$('#photoConfirm').attr('data-open', $(this).attr('data-title'));
	$('#checkbox-1a').prop('checked',($(this).attr('data-title') == $('#albumTitle').attr('data-thumbnail'))).checkboxradio('refresh');
});
$('html').on('click', '#photoConfirm', function(){
	var newtitle = $('#photoName').val().trim();
	var newdesc = $('#photoDescription').val();
	var oldtitle = $(this).attr('data-open');
	var olddesc = $('a[data-title="' + oldtitle + '"]').attr('data-desc');
	if (newtitle != oldtitle || olddesc != newdesc) {
		$.ajax({
			method: "POST",
			url: options.url + "UpdateFile",
			 xhrFields: { withCredentials: true },
			data: { albumName: $('#albumTitle').html(), filename: $(this).attr('data-open'), description: newdesc, newName: newtitle }
		}).success(function(result) {
			if (result.Error) myalert(JSON.stringify(result.Error));
			else {
				$('a[data-title="' + oldtitle + '"]').attr('data-desc',newdesc).prev().find('p').html(newdesc);
				$('a[data-title="' + oldtitle + '"]').attr('data-title',newtitle).prev().find('h2').html(newtitle);
				updateThumb(newtitle);
			}
		});
	}
	else updateThumb(oldtitle);
});
function updateThumb(newthumb,force) {
	if (force || ($('#checkbox-1a').is(':checked') && newthumb != $('#albumTitle').attr('data-thumbnail'))) {
		$.ajax({
			method: "POST",
			url: options.url + "SetThumbnail",
			 xhrFields: { withCredentials: true },
			data: { albumName: $('#albumTitle').html(), thumbnail: newthumb }
		}).success(function(result) {
			if (result.Error) myalert(JSON.stringify(result.Error));
			else {
				$('#albumTitle').attr('data-thumbnail',newthumb);
				$('a[data-title="' + $('#albumTitle').html() + '"]').prev().attr('data-thumbnail',newthumb).find('img').attr('src',(newthumb ? options.staticFolder + options.userName + '/' + $('#albumTitle').html() + '/' + newthumb : options.staticFolder + 'placeholder.png'));
			}
		});
	}	
}
$('html').on('click','#deletePhoto',function() {
	var thisfile = $('#photoConfirm').attr('data-open');
	$.ajax({
			method: "POST",
			xhrFields: { withCredentials: true },
			url: options.url + "DeletePic",
			data: { albumName: $('#albumTitle').html(), filename: thisfile }
		}).success(function(result) {
			if (result.Error) myalert(result.Error);
			else {
				$('a[data-title="' + $('#photoConfirm').attr('data-open') + '"]').parent().remove();
				if (thisfile == $('#albumTitle').attr('data-thumbnail')) {
					updateThumb($('a[data-title]:visible').first().attr('data-title'),true);
				}
			}
		});
});
$(document).on('pageshow','#bar',function() { 
	if (!$('#albumTitle').attr('data-thumbnail')) {
		$.mobile.changePage( "admin.html", {
		  transition: "slide",
		  reverse: true
		});
	}
});
$(document).on('pageshow','#dynamicPage',function() { $('#sortable2').empty(); });
function myalert(message,title) {
	setTimeout(function() {
	console.log(message);
  //create a div for the popup
    var $popUp = $("<div/>").popup({
        dismissible : true,
        theme : "b",
        overlyaTheme : "a",
        transition : "pop"
    }).on("popupafterclose", function() {
                    //remove the popup when closing
        $(this).remove();
    });
    //create a title for the popup
    $("<h3/>", {
        text : (typeof title === 'undefined' ? "Error" : title)
    }).appendTo($popUp);

            //create a message for the popup
    $("<p/>", {
        text : message
    }).appendTo($popUp);
    $popUp.popup("open").trigger("create");	
},500);
}
$('html').on('click','#loginbtn',function() {
	$.ajax({
		method: "POST",
		xhrFields: { withCredentials: true },
		url: options.url + "Login",
		data: { login: $('#un').val(), password: $('#pw').val() }
	}).success(function(result) {
		if (result.Error) myalert(result.Error);
		else {
			myalert("Login successful","Welcome");
		}
	});
});
$('html').on('click','#uploadBtn',function() {
	$('#fileinput').trigger('click'); 
	document.getElementById('fileinput').addEventListener('change', readFiles, false);
});

function readFiles(evt) {
	var data = new FormData();
	jQuery.each(jQuery('#fileinput')[0].files, function(i, file) {
		data.append('files', file);
	});
	data.append("albumName", $('#albumName').text().trim());
	$.ajax({
		url:options.url + "Upload",
		type:"POST",
		xhrFields: { withCredentials: true },
		crossDomain: true,
		data : data,
		 processData: false,
  contentType: false 
		}).success(function(result) {
			if (result.Error) myalert(result.Error);
			else { $('#sortable2').empty(); $('a[data-title="Others"]').parent().find('a[href="#bar"]').click(); myalert("Uploaded successfully","Success"); }
		});
		$('#fileinput').val(null);
}
