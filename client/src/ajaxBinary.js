// Adds ability to receive AJAX data as binary blobs
// (by default it is transported as a string, which mangles binary data)

$.ajaxTransport('+binary', function(options, originalOptions, jqXHR) {
  // Check for conditions and support for blob / arraybuffer response type
  if (window.FormData && ((options.dataType && (options.dataType === 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob))))) {
    return {
      // Create new XMLHttpRequest
      send: function(headers, callback) {
        // Setup all variables
        var xhr = new XMLHttpRequest(),
          url = options.url,
          type = options.type,
          async = options.async || true,
          dataType = options.responseType || 'blob',
          data = options.data || null,
          username = options.username || null,
          password = options.password || null;

        xhr.addEventListener('load', function() {
          var data = {};
          data[options.dataType] = xhr.response;

          // Make callback and send data
          callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
        });

        xhr.open(type, url, async, username, password);

        // Setup custom headers
        for (var i in headers ) {
          xhr.setRequestHeader(i, headers[i]);
        }

        xhr.responseType = dataType;
        xhr.send(data);
      },
      abort: function() {
        jqXHR.abort();
      }
    };
  }
});
