import { Template } from 'meteor/templating';
import { TasksCollection } from "../db/TasksCollection"; 
import { ReactiveDict } from 'meteor/reactive-dict';
import './App.html';
import './Task.js';
import './Login.js';

const HIDE_COMPLETED_STRING = "hideCompleted";
const getUser = () => Meteor.user();
const isUserLogged = () => !!getUser();
const IS_LOADING_STRING = "isLoading";

Template.mainContainer.onCreated(function mainContainerOnCreated() {
  this.state = new ReactiveDict();
  const handler = Meteor.subscribe('tasks');
  Tracker.autorun(() => {
    this.state.set(IS_LOADING_STRING, !handler.ready());
  });
});

const getTasksFilter = () => {
  const user = getUser();

  const hideCompletedFilter = { isChecked: { $ne: true } };

  const userFilter = user ? { userId: user._id } : {};

  const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

  return { userFilter, pendingOnlyFilter };
}
Template.mainContainer.events({  
  "click #hide-completed-button"(event, instance) {
    const currentHideCompleted = instance.state.get(HIDE_COMPLETED_STRING);
    instance.state.set(HIDE_COMPLETED_STRING, !currentHideCompleted);
  },
  'click .user'() {
    Meteor.logout();
  }
});
Template.mainContainer.helpers({
  tasks() {
    const instance = Template.instance();
    const hideCompleted = instance.state.get(HIDE_COMPLETED_STRING);
    const { pendingOnlyFilter, userFilter } = getTasksFilter();

    if (!isUserLogged()) {
      return [];
    }
    return TasksCollection.find(hideCompleted ? pendingOnlyFilter : userFilter, {
      sort: { createdAt: -1 },
    }).fetch();
  },
  isLoading() {
    const instance = Template.instance();
    return instance.state.get(IS_LOADING_STRING);
  },
  hideCompleted() {
    return Template.instance().state.get(HIDE_COMPLETED_STRING);
  },
  incompleteCount() {
    if (!isUserLogged()) {
      return '';
    }
    const { pendingOnlyFilter } = getTasksFilter();
    const incompleteTasksCount = TasksCollection.find(pendingOnlyFilter).count();
    return incompleteTasksCount ? `(${incompleteTasksCount})` : '';
  },
  isUserLogged(){
    return isUserLogged();
  },
  getUser() {
    return getUser();
  }
});

Template.form.events({
"submit .task-form"(event){
  event.preventDefault();
  const target = event.target;
  const text = target.text.value;
 /* TasksCollection.insert({ 
    text,
    userId: getUser()._id,
    createdAt: new Date() 
  });*/
  // Insert a task into the collection
  Meteor.call('tasks.insert', text);
  target.text.value = '';
},
});