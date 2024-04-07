BusData = function(editorUi, container)
{
	this.editorUi = editorUi;
	this.container = container;
};

/**
 * Background color for inactive tabs.
 */
BusData.inactiveTabBackgroundColor = '#e4e4e4';

/**
 * Adds the label menu items to the given menu and parent.
 */
BusData.prototype.init = function()
{
    var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	
	this.update = mxUtils.bind(this, function(sender, evt)
	{
		this.refresh();
	});
	
	graph.getSelectionModel().addListener(mxEvent.CHANGE, this.update);
	graph.getModel().addListener(mxEvent.CHANGE, this.update);
	graph.addListener(mxEvent.EDITING_STARTED, this.update);
	graph.addListener(mxEvent.EDITING_STOPPED, this.update);
	graph.getView().addListener('unitChanged', this.update);
	editor.addListener('autosaveChanged', this.update);
	graph.addListener(mxEvent.ROOT, this.update);
	ui.addListener('styleChanged', this.update);
	ui.addListener('darkModeChanged', this.update);
	
	this.refresh();
};


/**
 * Adds the label menu items to the given menu and parent.
 */
BusData.prototype.clear = function()
{
	this.container.innerText = '';
	
	// Destroy existing panels
	if (this.panels != null)
	{
		for (var i = 0; i < this.panels.length; i++)
		{
			this.panels[i].destroy();
		}
	}
	
	this.panels = [];
};

/**
 * Adds the label menu items to the given menu and parent.
 */
BusData.prototype.refresh = function()
{
	if (this.pendingRefresh != null)
	{
		window.clearTimeout(this.pendingRefresh);
		this.pendingRefresh = null;
	}

	this.pendingRefresh = window.setTimeout(mxUtils.bind(this, function()
	{
		this.immediateRefresh();
	}));
};

/**
* Adds the label menu items to the given menu and parent.
*/
BusData.prototype.immediateRefresh = function()
{
   // Performance tweak: No refresh needed if not visible
   if (this.container.style.width == '0px')
   {
       return;
   }
   
   this.clear();
   var ui = this.editorUi;
   var graph = ui.editor.graph;
   
   var div = document.createElement('div');
   div.style.whiteSpace = 'nowrap';
   div.style.color = Editor.isDarkMode() ? '#8D8D8D' : '#616161';
   div.style.textAlign = 'left';
   div.style.cursor = 'default';
   
   var label = document.createElement('div');
   label.className = 'geFormatSection';
   label.style.textAlign = 'center';
   label.style.fontWeight = 'bold';
   label.style.paddingTop = '8px';
   label.style.fontSize = '13px';
   label.style.borderWidth = '0px 0px 1px 1px';
   label.style.borderStyle = 'solid';
   label.style.display = 'inline-block';
   label.style.height = '25px';
   label.style.overflow = 'hidden';
   label.style.width = '100%';
   this.container.appendChild(div);
   
   // Prevents text selection
   mxEvent.addListener(label, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown',
       mxUtils.bind(this, function(evt)
   {
       evt.preventDefault();
   }));

   var ss = ui.getSelectionState();
   var containsLabel = ss.containsLabel;
   var currentLabel = null;
   var currentPanel = null;
   
   var addClickHandler = mxUtils.bind(this, function(elt, panel, index, lastEntry)
   {

       var clickHandler = mxUtils.bind(this, function(evt)
       {
           if (currentLabel != elt)
           {
               if (containsLabel)
               {
                   this.labelIndex = index;
               }
               else if (graph.isSelectionEmpty())
               {
                   this.diagramIndex = index;
               }
               else
               {
                   this.currentIndex = index;
               }
               
               if (currentLabel != null)
               {
                   currentLabel.style.backgroundColor = Format.inactiveTabBackgroundColor;
                   currentLabel.style.borderBottomWidth = '1px';
               }

               currentLabel = elt;
               currentLabel.style.backgroundColor = '';
               currentLabel.style.borderBottomWidth = '0px';
               
               if (currentPanel != panel)
               {
                   if (currentPanel != null)
                   {
                       currentPanel.style.display = 'none';
                   }
                   
                   currentPanel = panel;
                   currentPanel.style.display = '';
               }
           }
       });
       
       mxEvent.addListener(elt, 'click', clickHandler);
       
       // Prevents text selection
       mxEvent.addListener(elt, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown',
           mxUtils.bind(this, function(evt)
       {
           evt.preventDefault();
       }));
       
       if ((lastEntry && currentLabel == null) ||
           (index == ((containsLabel) ? this.labelIndex : ((graph.isSelectionEmpty()) ?
           this.diagramIndex : this.currentIndex))))
       {
           // Invokes handler directly as a workaround for no click on DIV in KHTML.
           clickHandler();
       }
   });
   
   var idx = 0;

   if (graph.isSelectionEmpty())
   {
       mxUtils.write(label, mxResources.get('diagram'));
       label.style.borderLeftWidth = '0px';

       div.appendChild(label);
       var diagramPanel = div.cloneNode(false);
       this.panels.push(new DiagramFormatPanel(this, ui, diagramPanel));
       this.container.appendChild(diagramPanel);
       
       if (Editor.styles != null)
       {
           diagramPanel.style.display = 'none';
           label.style.width = (this.showCloseButton) ? '106px' : '50%';
           label.style.cursor = 'pointer';
           label.style.backgroundColor = Format.inactiveTabBackgroundColor;
           
           var label2 = label.cloneNode(false);
           label2.style.borderLeftWidth = '1px';
           label2.style.borderRightWidth = '1px';
           label2.style.backgroundColor = Format.inactiveTabBackgroundColor;
           
           addClickHandler(label, diagramPanel, idx++);
           
           var stylePanel = div.cloneNode(false);
           stylePanel.style.display = 'none';
           mxUtils.write(label2, mxResources.get('style'));
           div.appendChild(label2);
           this.panels.push(new DiagramStylePanel(this, ui, stylePanel));
           this.container.appendChild(stylePanel);
           
           addClickHandler(label2, stylePanel, idx++);
       }
       
       // Adds button to hide the format panel since
       // people don't seem to find the toolbar button
       // and the menu item in the format menu
       if (this.showCloseButton)
       {
           var label2 = label.cloneNode(false);
           label2.style.borderLeftWidth = '1px';
           label2.style.borderRightWidth = '1px';
           label2.style.borderBottomWidth = '1px';
           label2.style.backgroundColor = Format.inactiveTabBackgroundColor;
           label2.style.position = 'absolute';
           label2.style.right = '0px';
           label2.style.top = '0px';
           label2.style.width = '25px';
           
           var img = document.createElement('img');
           img.setAttribute('border', '0');
           img.setAttribute('src', Dialog.prototype.closeImage);
           img.setAttribute('title', mxResources.get('hide'));
           img.style.position = 'absolute';
           img.style.display = 'block';
           img.style.right = '0px';
           img.style.top = '8px';
           img.style.cursor = 'pointer';
           img.style.marginTop = '1px';
           img.style.marginRight = '6px';
           img.style.border = '1px solid transparent';
           img.style.padding = '1px';
           img.style.opacity = 0.5;
           label2.appendChild(img)
           
           mxEvent.addListener(img, 'click', function()
           {
               ui.actions.get('format').funct();
           });
           
           div.appendChild(label2);
       }
   }
   else if (graph.isEditing())
   {
       mxUtils.write(label, mxResources.get('text'));
       div.appendChild(label);
       label.style.borderLeftStyle = 'none';
       this.panels.push(new TextFormatPanel(this, ui, div));
   }
   else
   {
       label.style.backgroundColor = Format.inactiveTabBackgroundColor;
       label.style.borderLeftWidth = '1px';
       label.style.cursor = 'pointer';
       label.style.width = ss.cells.length == 0 ? '100%' :
           (containsLabel ? '50%' : '33.3%');
       var label2 = label.cloneNode(false);
       var label3 = label2.cloneNode(false);

       // Workaround for ignored background in IE
       label2.style.backgroundColor = Format.inactiveTabBackgroundColor;
       label3.style.backgroundColor = Format.inactiveTabBackgroundColor;
       
       // Style
       if (containsLabel)
       {
           label2.style.borderLeftWidth = '0px';
       }
       else if (ss.cells.length > 0)
       {
           label.style.borderLeftWidth = '0px';
           mxUtils.write(label, mxResources.get('style'));
           div.appendChild(label);
           
           var stylePanel = div.cloneNode(false);
           stylePanel.style.display = 'none';
           this.panels.push(new StyleFormatPanel(this, ui, stylePanel));
           this.container.appendChild(stylePanel);

           addClickHandler(label, stylePanel, idx++);
       }
       
       // Text
       mxUtils.write(label2, mxResources.get('text'));
       div.appendChild(label2);

       var textPanel = div.cloneNode(false);
       textPanel.style.display = 'none';
       this.panels.push(new TextFormatPanel(this, ui, textPanel));
       this.container.appendChild(textPanel);
       
       // Arrange
       mxUtils.write(label3, mxResources.get('arrange'));
       div.appendChild(label3);

       var arrangePanel = div.cloneNode(false);
       arrangePanel.style.display = 'none';
       this.panels.push(new ArrangePanel(this, ui, arrangePanel));
       this.container.appendChild(arrangePanel);

       if (ss.cells.length > 0)
       {
           addClickHandler(label2, textPanel, idx + 1);
       }
       else
       {
           label2.style.display = 'none';
       }
       
       addClickHandler(label3, arrangePanel, idx++, true);
   }
};

/**
 * Adds the label menu items to the given menu and parent.
 */
StyleFormatPanel = function(format, editorUi, container)
{
	BaseFormatPanel.call(this, format, editorUi, container);
	this.init();
};

mxUtils.extend(StyleFormatPanel, BaseFormatPanel);