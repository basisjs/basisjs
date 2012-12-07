
  basis.require('basis.net');


  // features support detection

  function fileAPISupport(){
    var input = document.createElement('input');
    input.type = 'file';
    return input.files !== undefined;
  }

  function formDataSupport(){
    return window.FormData !== undefined;
  }

  function createIFrame(){
    var frame = document.createElement('iframe');
    frame.style.position = 'absolute';
    frame.style.left = '-2000px';
    frame.style.top = '-2000px';
    frame.name = frame.id = 'f' + Math.floor(Math.random() * 99999);
    frame.src = 'about:blank';

    return frame;
  }

  function getIFrameDocument(frame){
    return frame.contentWindow ? frame.contentWindow.document : frame.contentDocument ? frame.contentDocument : frame.document;
  }

  //
  // FileUploader
  //
  var FileUploader;

  if (fileAPISupport() && formDataSupport()) // XMLHttpRequest2
  { 
    FileUploader = basis.net.Transport.subclass({
      method: 'POST',
      contentType: 'multipart/form-data',

      formSubmit: function(form, requestData){
        var formData = new FormData(form);

        var requestConfig = Object.extend({}, requestData);

        this.request(Object.extend(requestConfig, {
          url: form.action,
          postBody: formData
        }));
      },
      
      uploadFiles: function(url, files){
        var formData = new FormData();

        for (var i = 0, file; file = files[i]; i++) 
          formData.append(file.name, file);

        this.request({
          url: url,
          postBody: formData
        });
      },

      event_start: function(request){
        basis.dom.event.addHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        basis.net.Transport.prototype.event_start.call(this, request);
      },
      event_complete: function(request){
        basis.dom.event.removeHandler(request.xhr.upload, 'progress', REQUEST_PROGRESS_HANDLER, request);
        basis.net.Transport.prototype.event_complete.call(this, request);
      }
    });

    var REQUEST_PROGRESS_HANDLER = function(event){
      if (event.lengthComputable) 
        this.setState(basis.data.STATE.PROCESSING, { loaded: event.loaded, total: event.total });
    } 
  }
  else //IFrame
  {
    var IFrameRequest = basis.net.AbstractRequest.subclass({
      state: basis.data.STATE.UNDEFINED,
      inprogress: false,

      init: function(){
        basis.net.AbstractRequest.prototype.init.call(this);

        this.frame = createIFrame();

        basis.dom.event.addHandlers(this.frame, { load: this.onLoad }, this);
      },
      onLoad: function(event){
        if (this.inprogress)
        {
          this.processResponse();

          if (this.isSuccessful())
            this.transport.event_success(this);
          else
            this.transport.event_failure(this);

          this.transport.event_complete(this);

          this.inprogress = false;
          var that = this;
          setTimeout(function(){
            that.removeFrame();
          }, 100);

          this.setState(basis.data.STATE.READY);
        }
      },
      isSuccessful: function(){
        return true;
      },
      processResponse: function(){
        var doc = getIFrameDocument(this.frame);
        var docRoot = doc.body ? doc.body : doc.documentElement;
        this.update({
          responseText: docRoot ? docRoot.innerHTML : null,
          responseXML: doc.XMLDocument ? doc.XMLDocument : doc
        });
      },
      insertFrame: function(){
        document.body.appendChild(this.frame);
      },
      removeFrame: function(){
        document.body.removeChild(this.frame);
      },
      doRequest: function(){
        var form = this.requestData.form;
        if (!form)
          return;

        this.transport.event_start(this);
        this.insertFrame();
        this.inprogress = true;
        this.setState(basis.data.STATE.PROCESSING);

        form.setAttribute('enctype', 'multipart/form-data');
        form.setAttribute('method', 'POST');
        form.setAttribute('target', this.frame.id);
        form.submit();
      },
      abort: function(){
        if (this.inprogress)
        {
          this.removeFrame();
          this.inprogress = false;
          this.transport.event_abort(this);
        }
      },
      destroy: function(){
        this.removeFrame();
        delete this.frame;

        basis.net.AbstractRequest.prototype.destroy.call();
      }
    });

    FileUploader = basis.net.AbstractTransport.subclass({
      requestClass: IFrameRequest,

      formSubmit: function(form, requestData){
        var requestConfig = Object.extend({}, requestData);
        this.request(Object.extend(requestConfig, { form: form }));
      }
    });
  }

  // exports
  module.exports = {
    FileUploader: FileUploader
  }
