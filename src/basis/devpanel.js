var inspectBasisRef = 'inspectBasis' + parseInt((1e11 - 1) * Math.random());
global[inspectBasisRef] = basis;

// load another instance of basis.js to don't influence on original one
var script = document.createElement('script');
script.setAttribute('src', basis.filename_);
script.setAttribute('basis-config',
  JSON.stringify({
    autoload: basis.path.dirname(basis.filename_) + '/devpanel',
    noConflict: true,
    inspectBasisRef: inspectBasisRef
  }).replace(/^\{|\}$/g, '')
);
basis.doc.head.add(script);

// croak namespace
delete basis.devpanel;
