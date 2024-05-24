resource "azurerm_storage_account" "windowsfunctionappsa" {
  name                     = "sawindowsfunctionapp"
  resource_group_name      = var.RESOURCE_GROUP
  location                 = var.LOCATION
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    resourcegroup = "docuai"
  }
 } 

 resource "azurerm_service_plan" "spwindowsfunctionapp" {
  name                     = "windowsfunctionappsa"
  resource_group_name      = var.RESOURCE_GROUP
  location                 = var.LOCATION
  os_type                  = "Windows"
  sku_name                 = "Y1"

  tags = {
    resourcegroup = "docuai"
  }
 } 

