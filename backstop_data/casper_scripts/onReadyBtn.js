module.exports = function(casper, scenario, vp) {
    casper.echo('onReadyButton.js', 'INFO');
    casper.then(function() {
        this.mouse.move(".btn-primary");
    });
    casper.wait(50);
};
