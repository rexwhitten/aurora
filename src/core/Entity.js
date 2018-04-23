// Aurora is distributed under the MIT license.

import UUID from "uuid/v4";
import getItem from "../utils/getItem";
import hasItem from "../utils/hasItem";
import Component from "./Component";

/** @classdesc Class representing an Entity. */
class Entity {

	/** Create an Entity.
		* @param {Object} [config] - JSON object containing Entity data. This is
		* used when loading a previously created Entity from disk, or creating an
		* Entity to be used as an assembly to clone into new Entity instances.
		* @param {String} [config.uuid] - UUID of the Entity.
		* @param {String} [config.type] - Type of the Entity.
		* @param {String} [config.name] - Name of the Entity. Typically also called
		* "unit type" or "class" in-game.
		* @param {Array} [config.components] - Array of Component data to generate
		* component instances from.
		* @param {Array} [config.tasks] - Array of task objects (upcoming) for
		* the entity to execute.
		* @returns {Entity} - The newly created Entity.
		*/
	constructor( config ) {

		// If building from JSON:
		if ( config ) {
			this._uuid = config.uuid || UUID();
			this._type = config.type || "no-type";
			this._name = config.name || "No Name";
			this._components = [];
			config.components.forEach( ( data ) => {
				this._addComponent( new Component( data ) );
			});
			this._tasks = config.tasks || [];
			this.tasksDirty = false;
		}

		// If creating a fresh instance:
		else {
			this._uuid = UUID();
			this._type = "untyped";
			this._name = "No Name";
			this._components = [];
			this._tasks = [];
		}

		this._dirty = false;

		return this;
	}

	/** @description Add a Component instance to the Entity. This method should
		* only be called internally, and never after the Entity has been registered.
		* @private
		* @param {Component} component - The Component to add.
		* @returns {(Array|null)} - Updated array of Components, or null the
		* Component already existed.
		*/
	_addComponent( component ) {
		// Don't add if it already exists:
		if ( this.hasComponent( component.getType() ) ) {
			console.warn( "Couldn't add "
				+ component.getType() + " to " + this.getUUID()
				+ ": Component already exists!"
			);
			return null;
		}
		this._components.push( component );
		this._dirty = true;
		return this._components;
	}

	/** @description Remove a Component instance from the Entity. This method
		* should only be called internally, and never after the Entity has been
		* registered.
		* @private
		* @param {String} type - Type of the Component to remove.
		* @returns {(Array|null)} - Updated array of Components, or null the
		* Component already existed.
		*/
	_removeComponent( type ) {
		const index = this._components.indexOf( this.getComponent( type ) );
		if ( index < 0 ) {
			console.warn( "Component with id " + type + "doesn't exist!" );
			return null;
		}
		this._components.splice( index, 1 );
		this._dirty = true;
		return this._components;
	}

	/** @description Clone the entity.
		* @returns {Entity} - New instance with the same components.
		*/
	clone() {
		return new this.constructor().copy( this );
	}

	/** @description Copy another entity (such as an assembly) into the entity,
		* replacing all components.
		* @param {Entity} source - Assembly to clone into the new entity.
		* @returns {Array} - Updated array of Components copied from source.
		*/
	copy( source ) {
		this._type = source.getType();
		this._name = source.getName();
		this._components = [];
		source.getComponents().forEach( ( component ) => {
			this._components.push( component.clone() );
		});
		this._dirty = true;
		return this._components;
	}

	/** @description Get a component instance by within the entity.
		* @readonly
		* @param {String} type - Type of the component to get.
		* @returns {(Component|null)} - Requested component, or null if not found.
		*/
	getComponent( type ) {
		return getItem( type, this._components, "_type" );
	}

	/** @description Get all of the entity's component types.
		* @readonly
		* @returns {Array} - Array of component types present within the entity.
		*/
	getComponentList() {
		const componentTypes = [];
		this._components.forEach( ( component ) => {
			componentTypes.push( component.getType() );
		});
		return componentTypes;
	}

	/** @description Get all of the Entity's components.
		* @readonly
		* @returns {Array} - Array of the Entity's components.
		*/
	getComponents() {
		return this._components;
	}

	/** @description Get the Entity's current task.
		* @readonly
		* @returns {Object} - The Entity's current task.
		*/
	getCurrentTask() {
		return this._tasks[ 0 ];
	}

	/** @description Get data by component type from the Entity. This is basically
		* a shorthand for .getComponent.getData();
		* @readonly
		* @param {String} type - Type of the component to get data from.
		* @returns {(Object|null)} - Requested component data, or null if not found.
		*/
	getData( type ) {
		const component = this.getComponent( type );
		if ( !component ) {
			console.warn( "Component with type " + type + " doesn't exist!" );
			return null;
		}
		return component.getData();
	}

	/** @description Get the Entity's name.
		* @readonly
		* @returns {String} - The Entity's name.
		*/
	getName() {
		return this._name;
	}

	/** @description Get the Entity's task list.
		* @readonly
		* @returns {Array} - The Entity's task list.
		*/
	getTasks() {
		return this._tasks;
	}

	/** @description Get the Entity's type.
		* @readonly
		* @returns {String} - The Entity's type.
		*/
	getType() {
		return this._type;
	}

	/** @description Get the Entity's UUID.
		* @readonly
		* @returns {String} - The Entity's UUID.
		*/
	getUUID() {
		return this._uuid;
	}

	/** @description Check if a component is present within the Entity.
		* @readonly
		* @param {String} type - Type of the component to check.
		* @returns {Bool} - True if the component is present within the Entity.
		*/
	hasComponent( type ) {
		return hasItem( type, this._components, "_type" );
	}

	/** @description Check if a Component has been changed since the last update.
		* @readonly
		* @returns {Bool} - True if the Entity has been changed.
		*/
	isDirty() {
		return this._dirty;
	}

	/** @description Print the Entity as JSON. Useful for saving to disk.
		* @readonly
		* @returns {String} - Ent
		*/
	print () {
		console.info( JSON.stringify( this, null, 4 ) );
		return this;
	};

	/** @description Overwrite the data for a Component with the given type within
		* the Entity.
		* @param {String} type - Type of the Component to check.
		* @param {Object} data - JSON data to apply to the Component.
		* @returns {(Array|null)} - Updated Component, or null if invalid.
		*/
	setComponentData( type, data ) {
		for ( let i = 0; i < this._components.length; i++ ) {
			if ( this._components[ i ].getType() === type ) {
				this._components[ i ].apply( data );
				this.setDirty();
				return this._components[ i ];
			}
		}
		console.warn( "Component with type " + type + " doesn't exist!" );
		return null;
	}

	/** @description Set a Component as dirty or clean.
		* @param {Bool} dirty - Value to set the dirty flag. Default is true.
		* @returns {Bool} - The Component's dirty flag.
		*/
	setDirty( dirty = true ) {
		this._dirty = dirty;
		return this._dirty;
	}

	/** @description Overwite the current task list with an array tasks.
		* @param {Array} tasks - Array of task objects to replace existing tasks.
		* @returns {Array} - Updated array of tasks.
		*/
	setTasks( tasks ) {
		// TODO: Add some validation!
		this._tasks = tasks;
		this.tasksDirty = true;
		this.setDirty();
		return this.tasks;
	};

	/** @description Append an array of tasks to the current task queue.
		* @param {Array} tasks - Array of task objects to replace existing tasks.
		* @returns {Array} - Updated array of tasks.
		*/
	appendTasks( tasks ) {
		// TODO: Add some validation!
		this._tasks.concat( tasks );
		this.setDirty();
		return this.tasks;
	};

	/** @description Insert an array of tasks into the front of the current task
		* queue.
		* @param {Array} tasks - Array of task objects to replace existing tasks.
		* @returns {Array} - Updated array of tasks.
		*/
	insertTasks( tasks ) {
		this._tasks = tasks.concat( this._tasks );
		this.tasksDirty = true;
		this.setDirty();
		return this.tasks;
	};

	/** @description Advance the current task by one.
		* @returns {Array} - Updated array of tasks.
		*/
	// Advance forward in the task queue:
	advanceTasks() {
		this._tasks.shift();
		this.tasksDirty = true;
		this.setDirty();
		return this.tasks;
	};

}

export default Entity;
